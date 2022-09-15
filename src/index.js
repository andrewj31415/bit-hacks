console.log("hi, webpack");

// Bit = Fixed(0|1) + Var(n: number) + And(Array<Bit>)
// every Bit has a .v (variant: string) and a .p (precednce: number).
// atomic Bit values (Fixed, Var) have precedence 100.
class Fixed {
    constructor(s) {
        /* s: 0|1 */
        this.v = "Fixed";
        this.p = 100;
        this.value = s;
    }
    toString() {
        return String(this.value);
    }
}
class Var {
    constructor(n) {
        /* n: number */
        this.v = "Var";
        this.p = 100;
        this.value = n;
    }
    toString() {
        return "x" + String(this.value);
    }
}
class And {
    constructor(A) {
        /* A: Array<Bit> */
        this.v = "And";
        this.p = 50;
        this.A = A;
    }
    toString() {
        return this.A.map((b) => {
            return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
        }).join("&");
    }
}
getAnd = (a, b) => {
    return new And([a, b]);
};
class Or {
    constructor(A) {
        /* A: Array<Bit> */
        this.v = "Or";
        this.p = 30;
        this.A = A;
    }
    toString() {
        return this.A.map((b) => {
            return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
        }).join("|");
    }
}
getOr = (a, b) => {
    return new Or([a, b]);
};
class Not {
    constructor(b) {
        /* b: Bit */
        this.v = "Not";
        this.p = 70;
        this.b = b;
    }
    toString() {
        return "!" + (this.p > this.b.p ? "(" : "") + this.b.toString() + (this.p > this.b.p ? ")" : "");
    }
}
getNot = (b) => {
    if (b.v === "Not") {
        return b.b;
    }
    if (b.v === "And") {
        return new Or(
            b.A.map((c) => {
                getNot(c);
            })
        );
    }
    if (b.v === "Or") {
        return new And(
            b.A.map((c) => {
                getNot(c);
            })
        );
    }
    if (b.v === "Fixed") {
        return new Fixed(1 - b.value);
    }
    return new Not(b);
};
console.log(getNot(new Var(1)).toString());
console.log(getNot(getNot(new Var(1))).toString());

//all operators are binary.
//parses text to the corresponding Bit expression
parseToLogic = (text) => {
    console.log("parsing to logic", text);
    let currentToken = "";
    let tokens = [];
    endToken = () => {
        tokens.push(currentToken);
        currentToken = "";
    };
    let level = 0;
    for (let letter of text) {
        if (letter === " ") {
            continue;
        } else if (letter === "(") {
            level += 1;
        } else if (letter === ")") {
            level -= 1;
            if (level === 0) {
                endToken();
            }
            if (level < 0) {
                throw "unbalanced parens!";
            }
        } else {
            if (["&", "|", "!"].includes(letter)) {
                if (currentToken.length > 0) {
                    endToken();
                }
                currentToken += letter;
                endToken();
            } else {
                currentToken += letter;
            }
        }
    }
    if (currentToken.length > 0) {
        endToken();
    }
    if (level !== 0) {
        throw "unbalanced parens!";
    }
    console.log("picked up tokens", tokens);
    if (tokens.length === 1) {
        return parseToBase(tokens[0]);
    }
    return parseTokenArray(tokens);
    // we have the tokens, consisting of expressions and operators.
};
//parses an array of tokens to the corresponding Bit expression.
parseTokenArray = (tokens) => {
    if (tokens.length === 1) {
        return parseToLogic(tokens[0]);
    }
    for (let pair of [
        ["|", getOr],
        ["&", getAnd],
        [
            "!",
            (first, second) => {
                return getNot(second);
            },
        ],
    ]) {
        let op = pair[0];
        let func = pair[1];
        if (tokens.includes(op)) {
            opIndex = tokens.indexOf(op);
            let first = tokens.slice(0, opIndex);
            let second = tokens.slice(opIndex + 1);
            if (first.length === 1) {
                first = parseToLogic(first[0]);
            } else if (first.length > 0 /*necessary to handle !*/) {
                first = parseTokenArray(first);
            }
            if (second.length === 1) {
                second = parseToLogic(second[0]);
            } else {
                second = parseTokenArray(second);
            }
            return func(first, second);
        }
    }
    console.log("tokens", tokens);
    throw "Don't understand tokens";
};
//parses a token containing a number or variable. returns a bit.
parseToBase = (token) => {
    if (token[0] === "x") {
        return new Var(Number(token.slice(1)));
    }
    return new Fixed(Number(token));
};

//add interactivity
document.getElementById("goButton").addEventListener("click", () => {
    text = document.getElementById("input").value;
    console.log("text", text);
    outputBit = parseToLogic(text);
    console.log(outputBit);
    document.getElementById("output").innerHTML = outputBit.toString();
});
