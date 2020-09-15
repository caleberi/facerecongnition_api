module.exports ={
        Colors: ()=> {
        return {
                Black: '\033[30m',
                Red: '\x1b[31m',
                Green: '\x1b[32m',
                Yellow: '\x1b[33m',
                Blue: '\033[34m',
                Magenta: '\033[35m',
                Cyan: '\033[36m',
                White: '\033[37m'
        }},
        color: (text, color) =>{
                return`${color}${text}\x1b[0m`;
        }
}