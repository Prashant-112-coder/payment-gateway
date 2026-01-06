
function buyNow() {
  var options = {
    key: "rzp_test_XXXXXXXXXX", // 🟡 your Razorpay TEST key here
    amount: 9900, // ₹99 in paise
    currency: "INR",
    name: "Prashant Resume Store",
    description: "Modern Resume Template",
    handler: function (response) {
      alert("Payment successful!\nPayment ID: " + response.razorpay_payment_id);
    },
    theme: {
      color: "#2b7cff"
    }
  };
  
  var rzp = new Razorpay(options);
  rzp.open();
}