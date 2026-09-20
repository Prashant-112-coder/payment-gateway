const BACKEND_URL = "https://razorpay-backend-ke6v.onrender.com";
const PRODUCT_ID = "modern-resume-pack";

function setPaymentStatus(message, state = "") {
  const status = document.getElementById("paymentStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function setBuyButtonsDisabled(disabled) {
  document.querySelectorAll(".buy-button").forEach((button) => {
    button.disabled = disabled;
    button.setAttribute("aria-busy", String(disabled));
  });
}

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const error = new Error(data.message || "The payment service returned an error.");
    error.requestId = data.requestId;
    throw error;
  }

  return data;
}

function createIdempotencyKey() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "checkout_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function getCustomer() {
  return {
    name: document.getElementById("customerName")?.value.trim() || "",
    email: document.getElementById("customerEmail")?.value.trim() || ""
  };
}

function validateCustomer(customer) {
  if (!customer.name) {
    throw new Error("Please enter your name before checkout.");
  }

  if (!customer.email) {
    throw new Error("Please enter your email so we can identify your receipt.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw new Error("Please enter a valid email address.");
  }
}

async function buyNow() {
  const customer = getCustomer();

  try {
    validateCustomer(customer);
  } catch (error) {
    setPaymentStatus(error.message, "error");
    document.getElementById("customerEmail")?.focus();
    return;
  }

  setBuyButtonsDisabled(true);
  setPaymentStatus("Preparing secure checkout…", "loading");

  try {
    const keyResponse = await fetch(`${BACKEND_URL}/api/razorpay-key`);
    const keyData = await readApiResponse(keyResponse);

    if (!keyData.success || !keyData.key) {
      throw new Error("Payment gateway is not configured yet.");
    }

    const orderResponse = await fetch(`${BACKEND_URL}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": createIdempotencyKey()
      },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        customer
      })
    });

    const orderData = await readApiResponse(orderResponse);

    if (!orderData.success || !orderData.order?.id) {
      throw new Error("The payment order could not be created.");
    }

    if (typeof Razorpay === "undefined") {
      throw new Error("Razorpay Checkout could not be loaded. Please refresh and try again.");
    }

    const order = orderData.order;

    const options = {
      key: keyData.key,
      amount: order.amount,
      currency: order.currency,
      name: "ResumeCraft",
      description: orderData.product?.name || "Modern Resume Pack",
      order_id: order.id,
      prefill: {
        name: customer.name,
        email: customer.email
      },
      notes: {
        productId: PRODUCT_ID
      },
      theme: {
        color: "#6d7cff"
      },
      handler: async function (response) {
        setPaymentStatus("Payment received. Verifying securely…", "loading");

        try {
          const verifyResponse = await fetch(`${BACKEND_URL}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await readApiResponse(verifyResponse);

          if (!verifyData.success) {
            throw new Error(verifyData.message || "Payment verification failed.");
          }

          setPaymentStatus("Payment verified successfully.", "success");
          showSuccessPopup(
            verifyData.orderId,
            verifyData.paymentId,
            verifyData.amount,
            verifyData.downloadUrl
          );
        } catch (error) {
          console.error("Verification error:", {
            message: error.message,
            requestId: error.requestId
          });
          setPaymentStatus(
            "Payment verification is pending. Keep your payment ID and contact support before retrying.",
            "error"
          );
        } finally {
          setBuyButtonsDisabled(false);
        }
      },
      modal: {
        ondismiss: function () {
          setPaymentStatus("Payment cancelled. You can try again whenever you're ready.", "error");
          setBuyButtonsDisabled(false);
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on("payment.failed", function (event) {
      console.error("Payment failed:", event?.error?.code);
      const message = event?.error?.description || "Payment could not be completed.";
      setPaymentStatus(message, "error");
      setBuyButtonsDisabled(false);
    });

    setPaymentStatus("Secure checkout is ready.", "success");
    rzp.open();
  } catch (error) {
    console.error("Checkout error:", {
      message: error.message,
      requestId: error.requestId
    });
    setPaymentStatus(
      error.requestId
        ? `${error.message} Reference: ${error.requestId}`
        : error.message || "Unable to start payment. Please try again.",
      "error"
    );
    setBuyButtonsDisabled(false);
  }
}

function showSuccessPopup(orderId, paymentId, amountPaise, downloadUrl) {
  document.getElementById("orderId").textContent = orderId;
  document.getElementById("paymentId").textContent = paymentId;
  document.getElementById("amount").textContent = (amountPaise / 100).toFixed(2);
  document.getElementById("date").textContent = new Date().toLocaleString();

  const downloadButton = document.getElementById("downloadButton");
  if (downloadButton) {
    downloadButton.disabled = !downloadUrl;
    downloadButton.hidden = !downloadUrl;
    downloadButton.onclick = () => {
      if (downloadUrl) window.location.href = downloadUrl;
    };
  }

  const modal = document.getElementById("successModal");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("successModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function scrollToProduct() {
  document.getElementById("products")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}
