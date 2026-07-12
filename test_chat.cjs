const puppeteer = require('puppeteer'); 
(async () => { 
  const browser = await puppeteer.launch(); 
  const page = await browser.newPage(); 
  page.on('console', msg => console.log('PAGE LOG:', msg.text())); 
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString())); 
  page.on('response', response => {
    if (response.url().includes('/api/chatbot/chat')) {
      console.log('CHATBOT API RESPONSE STATUS:', response.status());
    }
  });
  try { 
    await page.goto('http://localhost:5173/admin/login', { waitUntil: 'networkidle2' }); 
    await page.type('input[type=text]', 'admin'); 
    await page.type('input[type=password]', 'admin123'); 
    await page.click('button[type=submit]'); 
    await page.waitForNavigation({ waitUntil: 'networkidle2' }); 
    await page.goto('http://localhost:5173/admin/students', { waitUntil: 'networkidle2' }); 
    console.log('Clicking chatbot...'); 
    await page.click('.glb-chatbot-trigger'); 
    await new Promise(r => setTimeout(r, 1000));
    console.log('Typing message...'); 
    await page.type('.glb-chatbot-textarea', 'hello'); 
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 4000));
    const replies = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.glb-chatbot-row.bot .glb-chatbot-bubble');
      return Array.from(msgs).map(m => m.innerText);
    });
    console.log('BOT REPLIES:', replies);
  } catch (e) { 
    console.log('REQUEST FAILED:', e.message); 
  } 
  await browser.close(); 
})();
