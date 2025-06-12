// Mock user data
const userData = {
  fullName: "Rickie Test",
  accountNumber: "K8BU4",
  paybillNumber: "4093115",
  phoneNumber: "254110517055",
  outstandingAmount: 2850,
  suspensionDate: "2024-01-15",
};

// Application state
let isLoading = false
let paymentStatus = "idle" // idle, success, error
let paymentOption = "full"

// DOM elements
const elements = {
  fullPaymentRadio: document.getElementById("full-payment"),
  customPaymentRadio: document.getElementById("custom-payment"),
  customAmountSection: document.getElementById("custom-amount-section"),
  customAmountInput: document.getElementById("custom-amount"),
  amountError: document.getElementById("amount-error"),
  paymentButton: document.getElementById("payment-button"),
  buttonText: document.getElementById("button-text"),
  buttonIcon: document.getElementById("button-icon"),
  successAlert: document.getElementById("success-alert"),
  errorAlert: document.getElementById("error-alert"),
  successMessage: document.getElementById("success-message"),
  errorMessage: document.getElementById("error-message"),
}

// Mock STK Push API call
async function triggerStkPush(phoneNumber, amount) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Simulate random success/failure (70% success rate)
  const isSuccess = Math.random() > 0.3

  if (isSuccess) {
    return {
      success: true,
      message: "Payment successful! Your account will be reactivated within 5 minutes.",
    }
  } else {
    return {
      success: false,
      message: "Payment failed. Please ensure you have sufficient balance and try again.",
    }
  }
}

// Utility functions
function formatNumber(num) {
  return num.toLocaleString()
}
function getIPAddress (resolve,reject){
fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        console.log("User IP Address:", data.ip);
        document.getElementById('ipdisplay').innerHTML=data.ip
      })
      .catch(err=>{
        // reject(err)
      })
}

const IP = getIPAddress()
console.log(IP)
document.getElementById('ipdisplay').innerHTML=IP
function hideAllAlerts() {
  elements.successAlert.style.display = "none"
  elements.errorAlert.style.display = "none"
}

function showSuccessAlert(message) {
  hideAllAlerts()
  elements.successMessage.textContent = message
  elements.successAlert.style.display = "flex"
}

function showErrorAlert(message) {
  hideAllAlerts()
  elements.errorMessage.textContent = message
  elements.errorAlert.style.display = "flex"
}

function showAmountError(message) {
  elements.amountError.textContent = message
  elements.amountError.style.display = "block"
}

function hideAmountError() {
  elements.amountError.style.display = "none"
}

function updateButtonText() {
  let amount
  if (paymentOption === "full") {
    amount = formatNumber(userData.outstandingAmount)
  } else {
    const customAmount = Number.parseFloat(elements.customAmountInput.value) || 0
    amount = formatNumber(customAmount)
  }

  if (isLoading) {
    elements.buttonText.textContent = "Processing Payment..."
    elements.buttonIcon.innerHTML = `
            <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
        `
  } else if (paymentStatus === "success") {
    elements.buttonText.textContent = "Payment Completed"
    elements.buttonIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
        `
  } else {
    elements.buttonText.textContent = `Pay KSh ${amount} via M-Pesa`
    elements.buttonIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
        `
  }
}

function validateCustomAmount() {
  const amount = Number.parseFloat(elements.customAmountInput.value)

  if (!elements.customAmountInput.value || isNaN(amount) || amount <= 0) {
    showAmountError("Please enter a valid amount")
    return false
  }

  if (amount > userData.outstandingAmount) {
    showAmountError("Amount cannot exceed outstanding balance")
    return false
  }

  hideAmountError()
  return true
}

async function handlePayment() {
  // Validate custom amount if selected
  if (paymentOption === "custom" && !validateCustomAmount()) {
    return
  }

  // Set loading state
  isLoading = true
  paymentStatus = "idle"
  elements.paymentButton.disabled = true
  hideAllAlerts()
  updateButtonText()

  const paymentAmount =
    paymentOption === "full" ? userData.outstandingAmount : Number.parseFloat(elements.customAmountInput.value)

  try {
    const result = await triggerStkPush(userData.phoneNumber, paymentAmount)

    if (result.success) {
      paymentStatus = "success"
      showSuccessAlert(result.message)
    } else {
      paymentStatus = "error"
      showErrorAlert(result.message)
    }
  } catch (error) {
    paymentStatus = "error"
    showErrorAlert("An unexpected error occurred. Please try again later.")
  } finally {
    isLoading = false
    elements.paymentButton.disabled = paymentStatus === "success"
    updateButtonText()
  }
}

// Event listeners
elements.fullPaymentRadio.addEventListener("change", function () {
  if (this.checked) {
    paymentOption = "full"
    elements.customAmountSection.style.display = "none"
    hideAmountError()
    updateButtonText()
  }
})

elements.customPaymentRadio.addEventListener("change", function () {
  if (this.checked) {
    paymentOption = "custom"
    elements.customAmountSection.style.display = "block"
    updateButtonText()
  }
})

elements.customAmountInput.addEventListener("input", () => {
  hideAmountError()
  updateButtonText()
})

elements.paymentButton.addEventListener("click", handlePayment)

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Set initial values
  document.getElementById("account-holder").textContent = userData.fullName
  document.getElementById("account-number").textContent = userData.accountNumber
  document.getElementById("paybill-number").textContent = userData.paybillNumber
  document.getElementById("phone-number").textContent = `+${userData.phoneNumber}`
  document.getElementById("outstanding-amount").textContent = `KSh ${formatNumber(userData.outstandingAmount)}`
  document.getElementById("full-amount-display").textContent = `KSh ${formatNumber(userData.outstandingAmount)}`

  // Set max value for custom amount input
  elements.customAmountInput.max = userData.outstandingAmount

  // Initialize button text
  updateButtonText()
})
