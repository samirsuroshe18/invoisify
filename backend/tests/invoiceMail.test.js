import { invoiceMail, sendInvoiceMail } from '../src/utils/mailSender.js';
import { Usage } from '../src/models/usage.model.js';

const details = (changes = {}) => ({
    to: 'accounts@acme.test', from: 'Northwind Studio', replyTo: 'hello@northwind.test', customerName: 'Acme Traders',
    number: 'INV-0007', total: 3824.23, currency: 'INR', dueDate: '2026-03-15', link: 'http://localhost:5178/i/0123456789abcdef0123456789abcdef', ...changes,
});

afterEach(() => {
    delete process.env.DAILY_MAIL_LIMIT;
});

test('the mail says who the invoice is from, what it is for and where to see it', () => {
    const mail = invoiceMail(details());

    expect(mail.subject).toBe('Invoice INV-0007 from Northwind Studio');
    expect(mail.html).toContain('Acme Traders');
    expect(mail.html).toContain('INR 3,824.23');
    expect(mail.html).toContain('15 Mar 2026');
    expect(mail.html).toContain('href="http://localhost:5178/i/0123456789abcdef0123456789abcdef"');
    expect(mail.replyTo).toBe('hello@northwind.test');
    expect(mail.senderName).toBe('Northwind Studio via Invoisify');
});

test('what the user typed cannot become markup or a second header in the mail', () => {
    const mail = invoiceMail(details({
        from: 'Evil <script>alert(1)</script> "Co"\r\nBcc: victim@example.com',
        customerName: '<img src=x onerror=alert(1)> & friends',
        replyTo: 'not an address\r\nBcc: victim@example.com',
    }));

    expect(mail.html).not.toMatch(/<script|<img/);
    // the business name is used in headers too, so its angle brackets and quotes are taken out
    expect(mail.html).toContain('Evil script');
    expect(mail.html).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; friends');
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.senderName).not.toMatch(/[\r\n<>"]/);
    expect(mail.replyTo).toBeUndefined();
});

test('sending counts against the site\'s mail for the day, and says whether it went', async () => {
    process.env.DAILY_MAIL_LIMIT = '1';

    expect(await sendInvoiceMail(details())).toBe('sent');
    expect(await sendInvoiceMail(details())).toBe('failed');
    expect((await Usage.findOne({ key: 'mail' })).count).toBe(1);
});
