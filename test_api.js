async function run() {
  const url = "https://script.google.com/macros/s/AKfycbwjCSwWV-XKxTTt_7eT3Enxpcw_o6mQ9oJsfyuYHYudJa4wTW4jhOwf-41itii2-ip1gg/exec";
  const start = Date.now();
  console.log("Start testing direct GAS connection...");
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        action: "savePackageEntry",
        data: {
          departmentId: "D001",
          departmentName: "ห้องตรวจผู้ป่วยนอก",
          emsList: [{ trackingNo: "TEST" + Date.now(), itemType: "EMS" }],
          userEmail: "System Admin"
        }
      }),
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: 'follow'
    });
    const text = await res.text();
    console.log("Success in", Date.now() - start, "ms", text);
  } catch (e) {
    console.log("Error in", Date.now() - start, "ms", e.message);
  }
}
run();
