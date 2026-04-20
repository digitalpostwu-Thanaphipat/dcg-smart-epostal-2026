
const payload = {
  action: 'saveEntry',
  payload: {
    departmentId: "DEPT_TEST",
    departmentName: "ศูนย์เทคโนโลยีสารสนเทศ",
    staffEmail: "admin@university.ac.th",
    personalQty: 0,
    workQty: 0,
    emsList: [{
       trackingNumber: "E2E-TEST-MANUAL",
       recipientName: "Test Recipient",
       itemType: "EMS",
       isPersonal: false,
       notes: ""
    }]
  }
};

console.log("Sending diagnostic payload to proxy...");
fetch('http://127.0.0.1:5173/api', {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(async res => {
   console.log("Status:", res.status);
   const text = await res.text();
   console.log("Raw Response:", text);
})
.catch(err => {
   console.error("Fetch Error:", err);
});
