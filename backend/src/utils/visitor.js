import net from 'net';

// The server sits behind the web app's proxy and the host's own. The first forwarded
// address is the visitor when the request came through the web app. Someone who calls
// the server directly can make that header up, so it is used only when it is an
// address at all, and limits that matter are also kept for the address the request
// really arrived from (connectionOf).
const visitorOf = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';

    return net.isIP(first) ? first : (req.ip || 'unknown');
};

// The address the request really arrived from. Normally that is the connecting address.
// Some hosts put proxies of their own in between, so the connecting address is one of
// theirs; such a host passes the caller's address in a header that a caller cannot set
// (Cloudflare: cf-connecting-ip). CONNECTION_IP_HEADER names that header. It must only
// be set where the host really overwrites it.
const connectionOf = (req) => {
    const header = (process.env.CONNECTION_IP_HEADER || '').trim().toLowerCase();
    const reported = header ? req.headers[header] : '';

    return typeof reported === 'string' && net.isIP(reported.trim()) ? reported.trim() : (req.ip || 'unknown');
};

export { visitorOf, connectionOf }
