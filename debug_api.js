const url = 'http://localhost:5173/api';
(async () => {
  const res = await fetch(url + '?action=searchPackages', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'searchPackages', keyword: 'E2E-TEST', department: '' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
