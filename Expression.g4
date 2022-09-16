

grammar Expression;

Whitespace  : [ \t\r\n]+ -> skip ;

Variable : [a-z] [a-z0-9_]* ;
Number : [0-9]+ ;


input : expr EOF ;

variable : Variable ;
number : Number ;

expr :  '(' expr ')'
    | binOp
    ;

binOp : left=binOp op=('&' | '|') right=binOp
    | unOp
    ;

unOp : op=('!' | '-') expr
    | exprPrimary;


exprPrimary : '(' expr ')'
    | variable
    | number
    ;

