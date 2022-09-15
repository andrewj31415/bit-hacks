// Generated from Expression.g4 by ANTLR 4.9.3
// jshint ignore: start
import antlr4 from 'antlr4';
import ExpressionListener from './ExpressionListener.js';

const serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786",
    "\u5964\u0003\u0005\b\u0004\u0002\t\u0002\u0003\u0002\u0003\u0002\u0003",
    "\u0002\u0003\u0002\u0002\u0002\u0003\u0002\u0002\u0002\u0002\u0006\u0002",
    "\u0004\u0003\u0002\u0002\u0002\u0004\u0005\u0007\u0003\u0002\u0002\u0005",
    "\u0006\u0007\u0004\u0002\u0002\u0006\u0003\u0003\u0002\u0002\u0002\u0002"].join("");


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.PredictionContextCache();

export default class ExpressionParser extends antlr4.Parser {

    static grammarFileName = "Expression.g4";
    static literalNames = [ null, "'hello'" ];
    static symbolicNames = [ null, null, "ID", "WS" ];
    static ruleNames = [ "r" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = ExpressionParser.ruleNames;
        this.literalNames = ExpressionParser.literalNames;
        this.symbolicNames = ExpressionParser.symbolicNames;
    }

    get atn() {
        return atn;
    }



	r() {
	    let localctx = new RContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, ExpressionParser.RULE_r);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 2;
	        this.match(ExpressionParser.T__0);
	        this.state = 3;
	        this.match(ExpressionParser.ID);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

ExpressionParser.EOF = antlr4.Token.EOF;
ExpressionParser.T__0 = 1;
ExpressionParser.ID = 2;
ExpressionParser.WS = 3;

ExpressionParser.RULE_r = 0;

class RContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = ExpressionParser.RULE_r;
    }

	ID() {
	    return this.getToken(ExpressionParser.ID, 0);
	};

	enterRule(listener) {
	    if(listener instanceof ExpressionListener ) {
	        listener.enterR(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof ExpressionListener ) {
	        listener.exitR(this);
		}
	}


}




ExpressionParser.RContext = RContext; 
