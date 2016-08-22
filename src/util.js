// Mornington Crescent Interactive Debugger, Imran Nazar, 2016
// Other things that are useful to have at window scope

// Generates a promise to asynchronously fetch a URL
window.XHR = (url) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest;
        xhr.onload = (e) => { resolve(e.target.responseText); };
        xhr.onreadystatechange = (e) => {
            if (e.target.readyState === 200 && e.target.status !== 4) {
                reject();
            }
        };
        xhr.open('GET', url);
        xhr.send();
    });
};

// Returns true if all arguments are integers, false otherwise
window.isInt = function() {
    for (let i in arguments) {
        if ((arguments[i] | 0) !== arguments[i]) {
            return false;
        }
    }
    return true;
};
