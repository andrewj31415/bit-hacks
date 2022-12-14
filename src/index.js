// for simple assertions

var N = 64; //number of bits

document.getElementById("box1").value = N;
document.getElementById("box2").value = N;

var littleEndian = false;
var reverseBits = true;
var hideColors = false;

//anything that produces a boolean expression with more terms than MAX_WEIGHT throws
//an error to avoid the page freezing.
var MAX_WEIGHT = 10000000 / 2;
var MAX_WEIGHT_ERR = "Too complicated to calculate. Try a shorter bit width (uint8_t).";

/**
 *  Throws the given message if bool is false.
 *
 * @param {boolean} bool
 * @param {string} message
 */
var assert = (bool, message) => {
    if (!bool) {
        throw new Error(message);
    }
};

/**
 * Detects if the given value is a number.
 *
 * @param {*} n
 * @returns true if n is a number and false otherwise
 */
var isNumber = (n) => {
    return typeof n === "number";
};

// Bit = Fixed(0|1) + Var(n: number) + And(Array<Bit>)
// every Bit has a .v (variant: string) and a .p (precednce: number).
// atomic Bit values (Fixed, Var) have precedence 100.
// Every bit has .name = "Bit" for type-checking.
// Every bit has .weight: number to avoid page freezing.
class Fixed {
    constructor(s) {
        /* s: 0|1 */
        assert(s === 0 || s === 1, `Bit value must be 0 or 1, not ${s}`);
        this.v = "Fixed";
        this.p = 100;
        this.value = s;
        this.name = "Bit";
        this.weight = 0;
    }
    toString() {
        return `<span ${hideColors ? `` : `class="constant"`}>${this.value}</span>`;
    }
}
class Var {
    /**
     *  The nth bith of variable vn.
     *
     * @param {number} n
     * @param {string} vn
     */
    constructor(n, vn) {
        assert(isNumber(n));
        this.v = "Var";
        this.p = 100;
        this.index = n;
        this.vn = vn;
        this.name = "Bit";
        this.weight = 1;
    }
    toString() {
        return `<span ${hideColors ? `` : `class="variable"`}>${this.vn}<sub>${this.index}</sub></span>`;
    }
}
class And {
    constructor(A) {
        /* A: Array<Bit> */
        assert(A.every((bit) => bit.name === "Bit"));
        assert(A.length >= 2);
        this.v = "And";
        this.p = 50;
        this.A = A;
        this.name = "Bit";
        this.weight =
            1 +
            A.reduce((prev, cur) => {
                return prev + cur.weight;
            }, 0);
        if (this.weight > MAX_WEIGHT) {
            throw new Error(MAX_WEIGHT_ERR);
        }
    }
    toString() {
        // the explicit conversion to string is only for type-checking.
        return String(
            this.A.map((b) => {
                return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
            }).join("&")
        );
    }
}
/**
 *
 * @param {Bit} a
 * @param {Bit} b
 * @returns {Bit} a Bit corresponding to a&&b, simplified if possible.
 */
let getBitAnd = (a, b) => {
    if (a.v === "Fixed") {
        return a.value === 0 ? a : b;
    }
    if (b.v === "Fixed") {
        return b.value === 0 ? b : a;
    }
    if (a.v === "Var" && b.v === "Not" && b.b.v === "Var" && a.index === b.b.index && a.vn === b.b.vn) {
        //x & !x = 0
        return new Fixed(0);
    }
    if (b.v === "Var" && a.v === "Not" && a.b.v === "Var" && b.index === a.b.index && b.vn === a.b.vn) {
        //!x & x = 0
        return new Fixed(0);
    }
    return new And([a, b]);
};
class Or {
    constructor(A) {
        /* A: Array<Bit> */
        assert(A.every((bit) => bit.name === "Bit"));
        assert(A.length >= 2);
        this.v = "Or";
        this.p = 30;
        this.A = A;
        this.name = "Bit";
        this.weight =
            1 +
            A.reduce((prev, cur) => {
                return prev + cur.weight;
            }, 0);
        if (this.weight > MAX_WEIGHT) {
            throw new Error(MAX_WEIGHT_ERR);
        }
    }
    toString() {
        // the explicit conversion to string is only for type-checking.
        return String(
            this.A.map((b) => {
                return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
            }).join("|")
        );
    }
}
/**
 *
 * @param {Bit} a
 * @param {Bit} b
 * @returns {Bit} a Bit corresponding to a||b, simplified if possible.
 */
let getBitOr = (a, b) => {
    if (a.v === "Fixed") {
        return a.value === 1 ? a : b;
    }
    if (b.v === "Fixed") {
        return b.value === 1 ? b : a;
    }
    if (a.v === "Var" && b.v === "Not" && b.b.v === "Var" && a.index === b.b.index && a.vn === b.b.vn) {
        //x | !x = 1
        return new Fixed(1);
    }
    if (b.v === "Var" && a.v === "Not" && a.b.v === "Var" && b.index === a.b.index && b.vn === a.b.vn) {
        //!x | x = 1
        return new Fixed(1);
    }
    return new Or([a, b]);
};
class Not {
    constructor(b) {
        /* b: Bit */
        assert(b.name === "Bit");
        this.v = "Not";
        this.p = 70;
        this.b = b;
        this.name = "Bit";
        this.weight = 1 + b.weight;
        if (this.weight > MAX_WEIGHT) {
            throw new Error(MAX_WEIGHT_ERR);
        }
    }
    toString() {
        return "!" + (this.p > this.b.p ? "(" : "") + this.b.toString() + (this.p > this.b.p ? ")" : "");
    }
}
/**
 *
 * @param {Bit} b
 * @returns {Bit} a Bit corresponding to !b, simplified if possible.
 */
let getBitNot = (b) => {
    if (b.v === "Not") {
        return b.b;
    }
    if (b.v === "And") {
        return b.A.map((c) => getBitNot(c)).reduce((prev, cur) => {
            return getBitOr(prev, cur);
        });
    }
    if (b.v === "Or") {
        return b.A.map((c) => getBitNot(c)).reduce((prev, cur) => {
            return getBitAnd(prev, cur);
        });
    }
    if (b.v === "Fixed") {
        return new Fixed(1 - b.value);
    }
    return new Not(b);
};
/**
 *
 * @param {Bit} a
 * @param {Bit} b
 * @returns {Bit} a Bit corresponding to a^b, simplified if possible.
 */
let getBitXor = (a, b) => {
    assert(a.name === "Bit" && b.name === "Bit");
    return getBitOr(getBitAnd(a, getBitNot(b)), getBitAnd(getBitNot(a), b));
};

/**
 * An N-bit integer.
 */
class Int {
    /**
     *  Constructs an integer whose ith bit is A[i].
     *
     * @param {Array<Bit>} A
     */
    constructor(A) {
        /* A: Array<Bit> */
        assert(A.length === N, `Int must have correct number of bits ${N}, not ${A.length}`);
        assert(A.every((bit) => bit.name === "Bit"));
        this.A = A;
        this.name = "Int";
    }
    toString() {
        let bitStrings = this.A.map((bit) => bit.toString());
        if (reverseBits) {
            bitStrings.reverse();
        }
        if (littleEndian) {
            let oldBitStrings = bitStrings.map((bit) => bit);
            for (let i = 0; i < N; i++) {
                bitStrings[i] = oldBitStrings[i ^ 7];
            }
        }
        return bitStrings.join(" ");
    }
    /**
     *
     * @param {number} int the value of the int
     * @returns an Int, all of whose bits are fixed values
     */
    static fromInt(int) {
        let newA = [];
        for (let i = 0; i < N; i++) {
            let rem = int % 2;
            newA.push(new Fixed(rem));
            int = (int - rem) / 2;
        }
        return new Int(newA);
    }
    /**
     * Converts the string s, possibly representing a value
     * larger than JavaScript's max into, into an int.
     *
     * @param {string} s representing a number
     * @returns the Int corresponding to s
     */
    static fromString(s) {
        let newInt = Int.fromInt(0);
        if (s.slice(0, 2) === "0x") {
            //hex
            s = s.slice(2);
            for (let i = 0; i < s.length; i++) {
                let nextDigit = Int.fromInt(parseInt("0x" + s[s.length - 1 - i])).lsft(Int.fromInt(4 * i));
                newInt = newInt.add(nextDigit);
            }
        } else if (s[0] === "0") {
            //octal
            let eight = Int.fromInt(8);
            let powEight = Int.fromInt(1);
            for (let i = 0; i < s.length; i++) {
                let nextDigit = Int.fromInt(parseInt(s[s.length - 1 - i]));
                newInt = newInt.add(nextDigit.mul(powEight));
                powEight = powEight.mul(eight);
            }
        } else {
            //decimal
            let ten = Int.fromInt(10);
            let powTen = Int.fromInt(1);
            for (let i = 0; i < s.length; i++) {
                let nextDigit = Int.fromInt(parseInt(s[s.length - 1 - i]));
                newInt = newInt.add(nextDigit.mul(powTen));
                powTen = powTen.mul(ten);
            }
        }
        return newInt;
    }
    /**
     *
     * @param {Int} that
     * @returns
     */
    and(that) {
        assert(that.name === "Int");
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitAnd(this.A[i], that.A[i]));
        }
        return new Int(newA);
    }
    /**
     *
     * @param {Int} that
     * @returns
     */
    or(that) {
        assert(that.name === "Int");
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitOr(this.A[i], that.A[i]));
        }
        return new Int(newA);
    }
    xor(that) {
        assert(that.name === "Int");
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitXor(this.A[i], that.A[i]));
        }
        return new Int(newA);
    }
    not() {
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitNot(this.A[i]));
        }
        return new Int(newA);
    }
    /**
     *  A ripple-carry adder.
     *
     * @param {Int} that
     * @param {Bit} cin
     * @returns this + that + cin
     */
    rca(that, cin) {
        assert(that.name === "Int");
        assert(cin.name === "Bit");
        let newA = [];
        let A = this.A;
        let B = that.A;
        for (let i = 0; i < N; i++) {
            newA.push(getBitXor(cin, getBitXor(A[i], B[i])));
            cin = getBitOr(getBitOr(getBitAnd(A[i], B[i]), getBitAnd(A[i], cin)), getBitAnd(B[i], cin));
        }
        return new Int(newA);
    }
    add(that) {
        assert(that.name === "Int");
        return this.rca(that, new Fixed(0));
    }
    sub(that) {
        assert(that.name === "Int");
        return this.rca(that.not(), new Fixed(1));
    }
    neg() {
        return Int.fromInt(0).sub(this);
    }
    /**
     * Shifts right by 2**exp if cond is true.
     * Keep in mind that cond may be a variable expression.
     *
     * @param {number} exp
     * @param {Bit} cond
     */
    bsft(exp, cond) {
        let newA = [];
        for (let i = 0; i < N; i++) {
            let value;
            if (i + 2 ** exp < N) {
                value = getBitOr(getBitAnd(this.A[i + 2 ** exp], cond), getBitAnd(this.A[i], getBitNot(cond)));
            } else {
                value = getBitAnd(this.A[i], getBitNot(cond));
            }
            newA.push(value);
        }
        return new Int(newA);
    }
    /**
     *
     * @param {Int} that
     * @returns this >> that
     */
    rsft(that) {
        let newInt = new Int(this.A);
        for (let i = 0; i < N; i++) {
            let cond = that.A[i];
            newInt = newInt.bsft(i, cond);
        }
        return newInt;
    }
    lsft(that) {
        let newA = this.A.map((bit) => bit);
        newA.reverse();
        let newInt = new Int(newA).rsft(that);
        newA = newInt.A;
        newA.reverse();
        return new Int(newA);
    }
    mul(that) {
        let newInt = Int.fromInt(0);
        for (let i = 0; i < N; i++) {
            //multiply this by the ith bit of that, then add it to newInt
            let nextA = [];
            for (let j = 0; j < N; j++) {
                if (j < i) {
                    nextA.push(new Fixed(0));
                } else {
                    nextA.push(getBitAnd(this.A[j - i], that.A[i]));
                }
            }
            let nextInt = new Int(nextA);
            newInt = newInt.add(nextInt);
        }
        assert(newInt.name === "Int");
        return newInt;
    }
}

/**
 *  Convenient factory function
 *
 * @param {number} n
 * @returns the Int corresponding to n
 */
var int = (n) => {
    return Int.fromInt(n);
};

/**
 * Throws unless int1 and int2
 * represent the same number
 *
 * @param {Int} int1
 * @param {Int} int2
 */
var assertSameFixedInt = (int1, int2) => {
    for (let i = 0; i < N; i++) {
        let b1 = int1.A[i];
        let b2 = int2.A[i];
        assert(b1.v === "Fixed");
        assert(b2.v === "Fixed");
        assert(b1.value === b2.value);
    }
};
/**
 * Throws unless int1 and int2
 * represent numbers which are different
 *
 * @param {Int} int1
 * @param {Int} int2
 */
var assertDifferentFixedInt = (int1, int2) => {
    for (let i = 0; i < N; i++) {
        let b1 = int1.A[i];
        let b2 = int2.A[i];
        assert(b1.v === "Fixed");
        assert(b2.v === "Fixed");
        if (b1.value === b2.value) {
            return;
        }
    }
    assert(false);
};
// some tests for Int
assertSameFixedInt(int(27), int(27));
assertDifferentFixedInt(int(3), int(4));
assertSameFixedInt(int(6).or(int(5)), int(7));
assertDifferentFixedInt(int(6).or(int(4)), int(7));
let oldN = N;
N = 32; //32-bit tests since JS only supports 53-bit integers
assertSameFixedInt(int(2 ** N - 1), int(0).sub(int(1)));
assertSameFixedInt(int(2 ** N - 1), int(1).neg());
assertSameFixedInt(int(2 ** N - 1).rsft(int(32)), int(0));
assertSameFixedInt(int(1).lsft(int(37)), int(0));
assertSameFixedInt(Int.fromString("157"), int(157));
assertSameFixedInt(Int.fromString("0x9d"), int(157));
assertSameFixedInt(Int.fromString("0235"), int(157));
N = oldN;

import antlr4 from "antlr4";
import ExpressionLexer from "../build/ExpressionLexer";
import ExpressionParser from "../build/ExpressionParser";
import ExpressionVisitor from "../build/ExpressionVisitor";

class Evaluate extends ExpressionVisitor {
    // Visit a parse tree produced by ExpressionParser#input.
    visitInput(ctx) {
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#variable.
    visitVariable(ctx) {
        let varName = ctx.getText();
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(new Var(i, varName));
        }
        let val = new Int(newA);
        return val;
    }

    // Visit a parse tree produced by ExpressionParser#number.
    visitNumber(ctx) {
        let value = ctx.getText();
        while (value.slice(-1) === "u" || value.slice(-1) === "U" || value.slice(-1) === "l" || value.slice(-1) === "L") {
            value = value.slice(0, -1);
        }
        return Int.fromString(value);
    }

    // Visit a parse tree produced by ExpressionParser#expr.
    visitExpr(ctx) {
        if (ctx.expr() !== null) {
            return this.visit(ctx.expr());
        }
        if (ctx.binOp() !== null) {
            return this.visit(ctx.binOp());
        }
        assert(false, "Did the grammar change?");
    }

    // Visit a parse tree produced by ExpressionParser#binOp.
    visitBinOp(ctx) {
        if (ctx.unOp() !== null) {
            let value = this.visit(ctx.unOp());
            assert(value.name === "Int");
            return value;
        }
        if (ctx.op !== null) {
            let first = this.visit(ctx.left);
            let second = this.visit(ctx.right);
            let op = ctx.op.text;
            if (op === "*") {
                return first.mul(second);
            }
            if (op === "+") {
                return first.add(second);
            }
            if (op === "-") {
                return first.sub(second);
            }
            if (op === "<<") {
                return first.lsft(second);
            }
            if (op === ">>") {
                return first.rsft(second);
            }
            if (op === "&") {
                return first.and(second);
            }
            if (op === "^") {
                return first.xor(second);
            }
            if (op === "|") {
                return first.or(second);
            }
            assert(false, "Did the grammar change?");
        }
        assert(false, "Did the grammar change?");
    }

    // Visit a parse tree produced by ExpressionParser#unOp.
    visitUnOp(ctx) {
        if (ctx.op !== null) {
            let expr = this.visit(ctx.unOp());
            assert(expr.name === "Int");
            let op = ctx.op.text;
            if (op === "+") {
                return expr;
            }
            if (op === "-") {
                return expr.neg();
            }
            if (op === "!") {
                return expr.not();
            }
            if (op === "~") {
                return expr.not();
            }
            assert(false, "Did the grammar change?");
        }
        if (ctx.exprPrimary() !== null) {
            let value = this.visit(ctx.exprPrimary());
            assert(value.name === "Int");
            return value;
        }
        assert(false, "Did the grammar change?");
    }

    // Visit a parse tree produced by ExpressionParser#exprPrimary.
    visitExprPrimary(ctx) {
        if (ctx.expr() !== null) {
            let value = this.visit(ctx.expr());
            assert(value.name === "Int");
            return value;
        }
        if (ctx.variable() !== null) {
            let value = this.visit(ctx.variable());
            assert(value.name === "Int");
            return value;
        }
        if (ctx.number() !== null) {
            let value = this.visit(ctx.number());
            assert(value.name === "Int");
            return value;
        }
        assert(false, "Did the grammar change?");
    }
}

// See https://stackoverflow.com/questions/51683104/how-to-catch-minor-errors
// and https://stackoverflow.com/questions/45025556/why-is-antlr-omitting-the-final-token-and-not-producing-an-error

import DefaultErrorStrategy from "../node_modules/antlr4/src/antlr4/error/DefaultErrorStrategy";
import InputMismatchException from "../node_modules/antlr4/src/antlr4/error/InputMismatchException.js";

class StrictErrorStrategy extends DefaultErrorStrategy {
    recover(recognizer, e) {
        let token = recognizer.getCurrentToken();
        let message = `parse error at line ${token.line}, position ${token.column} right before ${this.getTokenErrorDisplay(
            token
        )} `;
        // console.log(e);
        throw new Error(message);
    }

    recoverInline(recognizer) {
        let token = recognizer.getCurrentToken();
        let message = `parse error at line ${token.line}, position ${token.column} right before ${this.getTokenErrorDisplay(
            token
        )} `;
        // console.log(new InputMismatchException(recognizer));
        throw new Error(message);
    }
    sync(recognizer) {
        /* do nothing to resync */
    }
}

class StrictLexer extends ExpressionLexer {
    recover(e) {
        // let message = `lex error after token ${this._lasttoken.Text} at position ${e.StartIndex}`;
        let message = `lex error at token ${this._input.strdata[e.startIndex]} at position ${e.startIndex}`;
        throw new Error(message);
    }
}

let stream = new antlr4.InputStream("");
let lexer = new ExpressionLexer(stream);
let tokens = new antlr4.CommonTokenStream(lexer);
var parser = new ExpressionParser(tokens); //make parser available for debugging statements like console.log(tree.toStringTree(null, parser))
var visitor = new Evaluate();

let getParseTree = (text) => {
    let stream = new antlr4.InputStream(text);
    let lexer = new StrictLexer(stream);
    let tokens = new antlr4.CommonTokenStream(lexer);
    let parser = new ExpressionParser(tokens);
    // parser.removeParseListeners();
    parser._errHandler = new StrictErrorStrategy();
    let tree = parser.expr();
    return tree;
};

let worked = false;
try {
    getParseTree("(1 <)");
} catch (e) {
    worked = true;
}
assert(worked, "Must throw error on invalid string");

let tree1 = getParseTree("0xFfULL");
assert(visitor.visit(tree1).toString() === int(255).toString());

let setOutput = () => {
    document.getElementById("output").textContent = "Processing ...";
    document.getElementById("warning").textContent = "";
    //setTimeout allows the page to update and show the "Processing ..." message.
    setTimeout(() => {
        try {
            let text = document.getElementById("input").value;
            let tree = getParseTree(text);
            // console.log("Parsed", tree);
            // console.log(tree.toStringTree(null, parser));
            let outputInt = visitor.visit(tree);
            document.getElementById("output").innerHTML = outputInt.toString();
            document.getElementById("warning").textContent = "";
        } catch (err) {
            document.getElementById("output").textContent = `Error!`;
            document.getElementById("warning").textContent = `${err.message}`;
            throw err;
        }
    }, 0);
};

//add interactivity
document.getElementById("input").addEventListener("input", () => {
    setOutput();
});
setOutput();

document.getElementById("box1").addEventListener("change", () => {
    N = Number(document.getElementById("box1").value);
    setOutput();
});
document.getElementById("box2").addEventListener("change", () => {
    N = Number(document.getElementById("box2").value);
    setOutput();
});

document.getElementById("littleEndian").addEventListener("change", () => {
    littleEndian = document.getElementById("littleEndian").checked;
    setOutput();
});
document.getElementById("reverseBits").addEventListener("change", () => {
    reverseBits = document.getElementById("reverseBits").checked;
    setOutput();
});
document.getElementById("hideColors").addEventListener("change", () => {
    hideColors = document.getElementById("hideColors").checked;
    setOutput();
});
