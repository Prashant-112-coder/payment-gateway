const BACKEND_URL = "/api/backend";
const UPI_ID = ""; // Add your UPI ID here when you want to enable optional UPI support.
const FREE_DOWNLOAD_BASE = `${BACKEND_URL}/free-download`;

function setPaymentStatus(message, state = "") {
  const status = document.getElementById("paymentStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function setBuyButtonsDisabled(disabled) {
  document.querySelectorAll(".catalog-buy").forEach((button) => {
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
  if (!customer.name) throw new Error("Please enter your name before checkout.");
  if (!customer.email) throw new Error("Please enter your email so we can identify your receipt.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error("Please enter a valid email address.");
}

function productTags(product) {
  const tier = product.id.includes("85") ? "85+ READY" : product.id.includes("90") ? "90+ READY" : product.id.includes("95") ? "95+ READY" : "100 STRUCTURE";
  return [tier, "ATS-FRIENDLY", "EDITABLE"];
}

function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = "";
  products.forEach((product, index) => {
    const tags = productTags(product);
    const colors = ["#536dfe","#0f766e","#334155","#7c3aed","#0369a1","#111827","#6d7cff"];
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.style.setProperty("--card-accent", colors[index % colors.length]);
    card.innerHTML = `
      <div class="corner-tag">${tags[0]}</div>
      <div class="catalog-preview"><div class="paper-preview"><div class="p-head"></div><div class="p-line accent"></div><div class="p-line"></div><div class="p-line short"></div><div class="p-line"></div><div class="p-line short"></div></div></div>
      <div class="catalog-content">
        <div class="catalog-kicker">RESUMECRAFT ORIGINAL</div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="catalog-tags">${tags.map(tag => `<span>✓ ${tag}</span>`).join("")}</div>
        <div class="catalog-footer">
          <div class="catalog-price"><small>Free download</small><strong>₹0</strong></div>
          <div class="catalog-actions"><button class="primary-btn catalog-buy" data-product-id="${product.id}" type="button">Download free →</button><button class="secondary-modal-btn catalog-support" type="button">Support with UPI</button></div>
        </div>
      </div>`;
    card.querySelector(".catalog-buy").addEventListener("click", () => downloadFree(product.id));
    card.querySelector(".catalog-support").addEventListener("click", () => showPurchaseOptions(product));
    grid.appendChild(card);
  });
}

async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (grid) grid.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`${BACKEND_URL}/api/products`);
    const data = await readApiResponse(response);
    if (!data.success || !Array.isArray(data.products)) throw new Error("Could not load the template library.");
    renderProducts(data.products);
  } catch (error) {
    if (grid) {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = `<div class="catalog-empty">${error.message}</div>`;
    }
  }
}

function showPurchaseOptions(product) {
  openUpiModal(product);
}

function downloadFree(productId) {
  window.location.href = `${FREE_DOWNLOAD_BASE}/${encodeURIComponent(productId)}`;
}

function openUpiModal(product) {
  const modal = document.getElementById("upiModal");
  const upiId = document.getElementById("upiId");
  const payButton = document.getElementById("upiPayButton");
  if (!modal) return;

  if (UPI_ID) {
    upiId.textContent = UPI_ID;
    payButton.hidden = false;
    payButton.onclick = () => {
      window.location.href = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=ResumeCraft&am=49&cu=INR`;
    };
  } else {
    upiId.textContent = "UPI ID coming soon";
    payButton.hidden = true;
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeUpiModal() {
  const modal = document.getElementById("upiModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

async function buyNow(productId) {
  const customer = getCustomer();
  try {
    validateCustomer(customer);
  } catch (error) {
    setPaymentStatus(error.message, "error");
    const target = !customer.name
      ? document.getElementById("customerName")
      : document.getElementById("customerEmail");
    target?.focus();
    return;
  }

  setBuyButtonsDisabled(true);
  setPaymentStatus("Preparing secure checkout…", "loading");

  try {
    const keyData = await readApiResponse(await fetch(`${BACKEND_URL}/api/razorpay-key`));
    if (!keyData.success || !keyData.key) throw new Error("Payment gateway is not configured yet.");

    const orderData = await readApiResponse(await fetch(`${BACKEND_URL}/create-order`, {
      method: "POST",
      headers: {"Content-Type":"application/json","X-Idempotency-Key":createIdempotencyKey()},
      body: JSON.stringify({productId, customer})
    }));

    if (!orderData.success || !orderData.order?.id) throw new Error("The payment order could not be created.");
    if (typeof Razorpay === "undefined") throw new Error("Razorpay Checkout could not be loaded. Please refresh and try again.");

    const options = {
      key:keyData.key, amount:orderData.order.amount, currency:orderData.order.currency,
      name:"ResumeCraft", description:orderData.product?.name || "Resume Template",
      order_id:orderData.order.id, prefill:{name:customer.name,email:customer.email},
      notes:{productId}, theme:{color:"#6d7cff"},
      handler:async function(response){
        setPaymentStatus("Payment received. Verifying securely…","loading");
        try{
          const verifyData=await readApiResponse(await fetch(`${BACKEND_URL}/verify-payment`,{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature})
          }));
          if(!verifyData.success) throw new Error(verifyData.message || "Payment verification failed.");
          setPaymentStatus("Payment verified successfully.","success");
          showSuccessPopup(verifyData.orderId,verifyData.paymentId,verifyData.amount,verifyData.downloadUrl);
        }catch(error){
          console.error("Verification error:",{message:error.message,requestId:error.requestId});
          setPaymentStatus("Payment verification is pending. Keep your payment ID and contact support before retrying.","error");
        }finally{setBuyButtonsDisabled(false);}
      },
      modal:{ondismiss:function(){setPaymentStatus("Payment cancelled. You can try again whenever you're ready.","error");setBuyButtonsDisabled(false);}}
    };
    const rzp=new Razorpay(options);
    rzp.on("payment.failed",function(event){setPaymentStatus(event?.error?.description || "Payment could not be completed.","error");setBuyButtonsDisabled(false);});
    setPaymentStatus("Secure checkout is ready.","success");
    rzp.open();
  }catch(error){
    console.error("Checkout error:",{message:error.message,requestId:error.requestId});
    const originBlocked = /origin is not allowed to access the payment service/i.test(error.message || "");
    const message = originBlocked
      ? `Razorpay blocked this storefront origin. Add ${window.location.origin} to the approved checkout origins, then retry.`
      : error.requestId
        ? `${error.message} Reference: ${error.requestId}`
        : error.message || "Unable to start payment. Please try again.";
    setPaymentStatus(message,"error");
    setBuyButtonsDisabled(false);
  }
}

let previousFocusedElement = null;

function getModalFocusableElements(modal) {
  return [...modal.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")];
}

function showSuccessPopup(orderId,paymentId,amountPaise,downloadUrl){
  document.getElementById("orderId").textContent=orderId;
  document.getElementById("paymentId").textContent=paymentId;
  document.getElementById("amount").textContent=(amountPaise/100).toFixed(2);
  document.getElementById("date").textContent=new Date().toLocaleString();
  const downloadButton=document.getElementById("downloadButton");
  if(downloadButton){downloadButton.disabled=!downloadUrl;downloadButton.hidden=!downloadUrl;downloadButton.onclick=()=>{if(downloadUrl)window.location.href=downloadUrl;};}
  const modal=document.getElementById("successModal");
  previousFocusedElement=document.activeElement;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  getModalFocusableElements(modal)[0]?.focus();
}

function closeModal(){
  const modal=document.getElementById("successModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  if(previousFocusedElement instanceof HTMLElement){previousFocusedElement.focus();}
  previousFocusedElement=null;
}

function handleModalKeydown(event){
  const modal=document.getElementById("successModal");
  if(!modal?.classList.contains("show")) return;
  if(event.key === "Escape"){
    event.preventDefault();
    closeModal();
    return;
  }
  if(event.key !== "Tab") return;
  const focusable=getModalFocusableElements(modal);
  if(!focusable.length) return;
  const first=focusable[0];
  const last=focusable[focusable.length-1];
  if(event.shiftKey && document.activeElement === first){
    event.preventDefault();
    last.focus();
  }else if(!event.shiftKey && document.activeElement === last){
    event.preventDefault();
    first.focus();
  }
}

function scrollToProduct(){document.getElementById("products")?.scrollIntoView({behavior:"smooth",block:"start"});}

document.addEventListener("keydown", handleModalKeydown);
document.addEventListener("DOMContentLoaded", loadProducts);
