async function buyNow() {
  try {
    // 1️⃣ Create order
    const response = await fetch("https://razorpay-backend-ke6v.onrender.com/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9900,   // ₹99 in paise
        currency: "INR"
      })
    });

    let data;
    // If server returned non-OK, avoid calling response.json() blindly (may be empty)
    if (!response.ok) {
      const text = await response.text();
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
      console.error("Create order request failed:", response.status, parsed || text);
      alert("❌ Order creation failed — check console for details.");
      return;
    }

    try {
      data = await response.json();
    } catch (err) {
      console.error('Failed to parse create-order response:', err);
      alert('❌ Order creation failed — invalid response from server. Check console.');
      return;
    }
    console.log("Order Response:", data);

    const orderId = data.id || data.order_id || data.order?.id || data.orderId || (data.data && data.data.id);
    const orderAmount = data.amount || data.order?.amount || (data.data && data.data.amount) || 9900;
    const orderCurrency = data.currency || data.order?.currency || (data.data && data.data.currency) || "INR";

    if (!orderId) {
      console.error("Order creation response missing id:", data);
      alert("❌ Order creation failed — check console for details.");
      return;
    }

    const order = { id: orderId, amount: orderAmount, currency: orderCurrency };

    // 2️⃣ Razorpay checkout
    var options = {
      key: "rzp_test_S0eeQglGbygi4C", // ONLY Key ID
      amount: order.amount,
      currency: order.currency,
      name: "Prashant",
      description: "Resume Template",
      order_id: order.id,
      handler: function (response) {
        console.log("Razorpay Response:", response);

        // Show success to user immediately (UI-first). Verification runs in background.
        try {
          showSuccessPopup(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            options.amount
          );
        } catch (err) {
          console.error('showSuccessPopup error:', err);
        }

        // Run verification in background; do not block UX.
        (async () => {
          try {
            const verifyRes = await fetch("https://razorpay-backend-ke6v.onrender.com/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const result = await (verifyRes.headers.get('content-type') || '').includes('application/json') ? verifyRes.json() : null;
            console.log("Verify Response:", verifyRes.status, result);

            if (!verifyRes.ok || !result || !result.success) {
              console.warn('Background verification failed:', result);
              // Keep success popup shown to user; log the issue for server-side checks.
            }
          } catch (err) {
            console.error('Background verify request error:', err);
          }
        })();
      },

      prefill: {
        name: "Prashant",
        email: "test@example.com",
        contact: "9999999999"
      },

      theme: {
        color: "#2b7cff"
      }
    };

    // Ensure Razorpay checkout script loaded
    if (typeof Razorpay === "undefined" && !(typeof window !== "undefined" && window.Razorpay)) {
      console.error("Razorpay checkout script not loaded or blocked");
      alert("Razorpay checkout script not loaded. Check console/network.");
      return;
    }

    try {
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (err) {
        console.error('Payment failed event:', err);
        alert('Payment failed: ' + (err.error && err.error.description ? err.error.description : 'Unknown error'));
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay open error:', err);
      alert('Failed to open Razorpay checkout. Check console.');
    }

  } catch (error) {
    console.error("Buy Now Error:", error);
    alert("Something went wrong. Check console.");
  }
}

// Show payment success modal and populate receipt
function showSuccessPopup(orderId, paymentId, amountPaise) {
  try {
    const modal = document.getElementById('successModal');
    if (!modal) return console.warn('Success modal not found');

    const orderEl = document.getElementById('orderId');
    const payEl = document.getElementById('paymentId');
    const amtEl = document.getElementById('amount');
    const dateEl = document.getElementById('date');

    if (orderEl) orderEl.textContent = orderId || '';
    if (payEl) payEl.textContent = paymentId || '';
    if (amtEl) amtEl.textContent = (Number(amountPaise || 0) / 100).toFixed(2);
    if (dateEl) dateEl.textContent = new Date().toLocaleString();

    modal.style.display = 'flex';
  } catch (e) {
    console.error('showSuccessPopup error:', e);
  }
}

function closeModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.style.display = 'none';
}