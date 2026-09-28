const movieSelect = document.getElementById("movie");
const theatreSelect = document.getElementById("theatre");
const seatsContainer = document.getElementById("seats");
const totalElement = document.getElementById("total");
const ticketCount = document.getElementById("ticketCount");
const summarySeats = document.getElementById("summarySeats");
const message = document.getElementById("message");
const payBtn = document.getElementById("payBtn");

let selectedTime = "";
let selectedSeats = [];

const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
const occupiedSeats = ["A4", "B6", "C2", "D7", "F3"];

rows.forEach(row => {
  for (let number = 1; number <= 8; number++) {
    const seatNumber = row + number;
    const button = document.createElement("button");
    button.textContent = seatNumber;
    button.className = "seat";

    if (occupiedSeats.includes(seatNumber)) {
      button.classList.add("occupied");
      button.disabled = true;
    }

    button.addEventListener("click", () => toggleSeat(button, seatNumber));
    seatsContainer.appendChild(button);
  }
});

function toggleSeat(button, seatNumber) {
  if (selectedSeats.includes(seatNumber)) {
    selectedSeats = selectedSeats.filter(seat => seat !== seatNumber);
    button.classList.remove("selected");
  } else {
    selectedSeats.push(seatNumber);
    button.classList.add("selected");
  }
  updateSummary();
}

document.querySelectorAll(".time-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".time-btn").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    selectedTime = button.textContent;
    document.getElementById("selectedTime").textContent =
      "Selected showtime: " + selectedTime;
    updateSummary();
  });
});

document.querySelectorAll(".movie-card").forEach(card => {
  card.addEventListener("click", () => {
    movieSelect.value = card.dataset.movie;
    document.querySelectorAll(".movie-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    updateSummary();
    document.querySelector(".summary").scrollIntoView({ behavior: "smooth" });
  });
});

movieSelect.addEventListener("change", updateSummary);
theatreSelect.addEventListener("change", updateSummary);

function getAmount() {
  const price = Number(movieSelect.options[movieSelect.selectedIndex].dataset.price);
  return selectedSeats.length * price;
}

function updateSummary() {
  document.getElementById("summaryMovie").textContent = movieSelect.value;
  document.getElementById("summaryTheatre").textContent = theatreSelect.value;
  document.getElementById("summaryTime").textContent = selectedTime || "Not selected";
  summarySeats.textContent = selectedSeats.length ? selectedSeats.join(", ") : "None";
  ticketCount.textContent = selectedSeats.length;
  totalElement.textContent = getAmount();
}

function showMessage(text, type) {
  message.textContent = text;
  message.style.color = type === "success" ? "#159447" : "#d71920";
}

payBtn.addEventListener("click", async () => {
  if (!selectedTime) {
    showMessage("Please select a showtime.", "error");
    return;
  }

  if (selectedSeats.length === 0) {
    showMessage("Please select at least one seat.", "error");
    return;
  }

  const amount = getAmount();
  payBtn.disabled = true;
  payBtn.textContent = "Opening Payment...";

  try {
    // Create the Razorpay order on the server.
    const response = await fetch("/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    const order = await response.json();

    if (!response.ok) {
      throw new Error(order.error || "Could not create payment order");
    }

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "MovieBook",
      description: `${movieSelect.value} movie ticket`,
      order_id: order.orderId,
      prefill: {
        name: "",
        email: "",
        contact: ""
      },
      theme: {
        color: "#e51b23"
      },

      handler: async function (paymentResponse) {
        // Verify payment on the server before confirming the booking.
        const verifyResponse = await fetch("/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            movie: movieSelect.value,
            theatre: theatreSelect.value,
            showtime: selectedTime,
            seats: selectedSeats,
            amount
          })
        });

        const result = await verifyResponse.json();

        if (!verifyResponse.ok || !result.verified) {
          showMessage("Payment could not be verified. Booking was not confirmed.", "error");
          payBtn.disabled = false;
          payBtn.textContent = "Proceed to Online Payment";
          return;
        }

        openConfirmation(result.bookingId, paymentResponse.razorpay_payment_id, amount);
      },

      modal: {
        ondismiss: function () {
          payBtn.disabled = false;
          payBtn.textContent = "Proceed to Online Payment";
          showMessage("Payment window closed. Booking is not confirmed.", "error");
        }
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.on("payment.failed", function (response) {
      showMessage(
        "Payment failed: " + (response.error.description || "Please try again."),
        "error"
      );
      payBtn.disabled = false;
      payBtn.textContent = "Proceed to Online Payment";
    });

    razorpay.open();

  } catch (error) {
    showMessage(error.message, "error");
    payBtn.disabled = false;
    payBtn.textContent = "Proceed to Online Payment";
  }
});

function openConfirmation(bookingId, paymentId, amount) {
  const confirmation = window.open(
    "",
    "bookingConfirmation",
    "width=500,height=650"
  );

  if (!confirmation) {
    showMessage(
      "Payment was successful, but the confirmation window was blocked. Allow pop-ups.",
      "error"
    );
    return;
  }

  confirmation.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Booking Confirmed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #170b2e, #e51b23);
          margin: 0; padding: 25px;
        }
        .ticket {
          background: white; border-radius: 18px; padding: 25px;
          max-width: 420px; margin: 20px auto;
          box-shadow: 0 10px 30px rgba(0,0,0,.3);
        }
        h1 { color: #159447; text-align: center; }
        .success { text-align: center; font-size: 50px; }
        p { line-height: 1.7; }
        .id {
          background: #eee; padding: 10px; border-radius: 8px;
          text-align: center; font-weight: bold;
        }
        .note { text-align: center; color: #777; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="success">✓</div>
        <h1>Payment Successful!</h1>
        <p><b>Movie:</b> ${movieSelect.value}</p>
        <p><b>Theatre:</b> ${theatreSelect.value}</p>
        <p><b>Showtime:</b> ${selectedTime}</p>
        <p><b>Seats:</b> ${selectedSeats.join(", ")}</p>
        <p><b>Amount Paid:</b> ₹${amount}</p>
        <p><b>Payment ID:</b> ${paymentId}</p>
        <div class="id">Booking ID: ${bookingId}</div>
        <p class="note">This confirmation window will close automatically in 5 seconds.</p>
      </div>
      <script>
        setTimeout(() => window.close(), 5000);
      <\/script>
    </body>
    </html>
  `);

  confirmation.document.close();
  showMessage("Payment successful! Booking confirmed.", "success");
  payBtn.disabled = true;
  payBtn.textContent = "Booking Confirmed";
}

updateSummary();
