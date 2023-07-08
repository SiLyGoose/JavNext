import { parse } from 'cookie';

const Cookie = (name) => {
    let parsedCookies = parse(document.cookie || "");
    let cookie = parsedCookies[name];

    if (cookie === null) cookie = localStorage.getItem(name);
    return cookie;
};

export default Cookie;