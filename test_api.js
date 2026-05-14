async function run() {
  const url = "https://script.google.com/macros/s/AKfycbzic6gqCo-b6gK-dXSknB4URqgvRqN8SU5-h-aWjm1G3jAfseCvH1rpGrSnwp63riEp/exec";
  const start = Date.now();
  console.log("Start testing direct GAS connection...");
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        action: "getInitialData"
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
