function buyNow() {
  var options = {
    key: "rzp_test_XXXXXXXXXX", // test key
    amount: 9900,
    currency: "INR",
    name: "Prashant Resume Store",
    description: "Modern Resume Template",
    prefill: {
      name: "Test User",
      email: "test@example.com",
      contact: "9999999999"
    },
    handler: function (response) {
      alert(
        "Payment successful!\nPayment ID: " +
        response.razorpay_payment_id
      );
    },
    modal: {
      ondismiss: function () {
        console.log("Checkout closed");
      }
    }
  };

  var rzp = new Razorpay(options);
  rzp.open();
}