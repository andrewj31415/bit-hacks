

grammar Expression;

Whitespace  : [ \t\r\n]+ -> skip ;

Variable : [a-zA-Z] [a-zA-Z0-9_]* ;
Number : (([0-9]+) | ('0x' [0-9a-fA-F]+)) [ulUL]* ;


input : expr EOF ;

variable : Variable ;
number : Number ;

expr :  '(' expr ')'
    | binOp
    ;

binOp :  left=binOp op=('*' | '/' | '%') right=binOp
    | left=binOp op=('+' | '-') right=binOp
    | left=binOp op=('<<' | '>>') right=binOp
    | left=binOp op='&' right=binOp
    | left=binOp op='^' right=binOp
    | left=binOp op='|' right=binOp
    | unOp
    ;

unOp : op=('!' | '~' | '-' | '+') unOp
    | exprPrimary;


exprPrimary : '(' expr ')'
    | variable
    | number
    ;

