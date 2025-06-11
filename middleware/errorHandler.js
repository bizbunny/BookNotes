//functions as middleware
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    //check status to check for errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "Invalid JSON" });
    }
    //display status    
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' ? 
            'Something went wrong' : 
            err.message 
    });
}

module.exports = errorHandler;