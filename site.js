//Firebase config 

var database = firebase.database();

//Slideshow JS
var slideIndex = 1;
showSlides(slideIndex);

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("Slides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  else if (n < 1) {slideIndex = slides.length}
  else {
    slideIndex = n;
  }
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
  }
  slides[slideIndex-1].style.display = "block";

  var buttons = document.getElementsByClassName("suiteButton");
  for (let roomButton of buttons) {
    roomButton.removeAttribute("selected");
  }
  buttons[slideIndex-1].setAttribute("selected", "true");
  SelectedRoom.style.backgroundImage = "url('./" + buttons[slideIndex-1].value + ".jpg')";
  SelectedRoom.style.display = "block";

}

//End Slideshow JS

//Step by step form JS

var currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab

function showTab(n) {
  // This function will display the specified tab of the form ...
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";
  // ... and fix the Previous/Next buttons:
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").innerHTML = "Submit";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
  }
  // ... and run a function that displays the correct step indicator:
  fixStepIndicator(n)
}

function nextPrev(n) {
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab");
  // Exit the function if any field in the current tab is invalid:
  if (n == 1 && !validateForm()) return false;
  // Hide the current tab:
  x[currentTab].style.display = "none";
  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;
  // if you have reached the end of the form... :
  if (currentTab >= x.length) {
    //...the form gets submitted:
    generateTicket(Math.round(Math.random() * 10000000)); //generate ticket and push to firebase
    return false;
  }
  // Otherwise, display the correct tab:
  showTab(currentTab);
}

function validateForm() {
  // This function deals with validation of the form fields
  var x, y, i, valid = true;
  x = document.getElementsByClassName("tab");
  y = x[currentTab].getElementsByTagName("input");
  // A loop that checks every input field in the current tab:
  for (i = 0; i < y.length; i++) {
    // If a field is empty...
    if (y[i].value == "") {
      // add an "invalid" class to the field:
      y[i].className += " invalid";
      // and set the current valid status to false:
      valid = false;
    }

    if (!y[i].validity.valid) {
      valid = false;
    }
  }
  // If the valid status is true, mark the step as finished and valid:
  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }
  return valid; // return the valid status
}

function fixStepIndicator(n) {
  // This function removes the "active" class of all steps...
  var i, x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  //... and adds the "active" class to the current step:
  x[n].className += " active";
}

function dateChecker() {
  if (CheckIn.value != "") {
    var checkOutDate = addDays(new Date(CheckIn.value), Days.value);
    CheckoutInput.value = stringifyDate(checkOutDate);
  }
  
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + Number(days));
  return result;
}

function stringifyDate(date) {

  var day = ("0" + date.getDate()).slice(-2);
  var month = ("0" + (date.getMonth() + 1)).slice(-2);

  var stringDate = date.getFullYear()+"-"+(month)+"-"+(day);
  return stringDate;
}

//End step by step form

CheckIn.min = stringifyDate(new Date());
CheckIn.addEventListener("change", dateChecker);
Days.addEventListener("change", dateChecker);

//Booking information updater

function calculateExtrasCost(extras) {
  var price = 0;
  for (let extra of extras) {
    if (extra.value === "Breakfast") {
      price += Number(extra.dataset.price) * Number(Days.value);
    } else {
      price += Number(extra.dataset.price);
    }
  }
  return price;
}

function updateBooking() {

  //Get all data from step by step form
  let chosenRoomButton = document.querySelector(".suiteButton[selected]");
  var chosenRoom = chosenRoomButton.value;
  var chosenRoomPrice = Number(chosenRoomButton.dataset.price);
  var chosenExtras = document.querySelectorAll(".extrasCheckbox:checked");
  if (chosenExtras !== null) {
    var extrasCost = calculateExtrasCost(chosenExtras)
  }
  var checkInDate = CheckIn.value;
  var checkOutDate = CheckoutInput.value;
  var numDays = Days.value;
  var price = Number(extrasCost) + Number(chosenRoomPrice) * Number(numDays);

  //update labels to show values;
  RoomType.innerHTML = "Room: " + chosenRoom;
  PricePerNight.innerHTML = "Price per night: " + chosenRoomPrice;
  Dates.innerHTML = "Check in date: " + checkInDate + "<br>Check out date: " + checkOutDate;
  NumDays.innerHTML = "Days: " + numDays;
  Extras.innerHTML = "Extras: ";
  var extraValuesArray = []
  if (chosenExtras === null) {
    Extras.innerHTML = "";
  }
  else {
    for (let extra of chosenExtras) {
      extraValuesArray.push(extra.value);
    }
    Extras.innerHTML = "Extras: " + extraValuesArray.join(", ");

  }
  Price.innerHTML = "Total price: $" + price;

  let bookingInfo = {
    "Room" : chosenRoom,
    "RoomPrice" : chosenRoomPrice,
    "Extras" : extraValuesArray,
    "Check in " : checkInDate,
    "Check out" : checkOutDate,
    "Days" : numDays,
    "Price" : price
  }

  return bookingInfo;

}

function addBookingListeners() {
  var inputs = document.getElementsByTagName("input");
  for (let input of inputs) {
    input.addEventListener("change", updateBooking);
  }
  Days.addEventListener("change", updateBooking);
}

function pushToFirebase(ticket) {
  var bookingInfo = updateBooking();
  bookingInfo.name = NameInput.value;
  bookingInfo.email = EmailInput.value;
  bookingInfo.phone = CellInput.value;


  database.ref("bookings/" + ticket).set(bookingInfo);
  TicketNo.innerHTML += ticket;
  StepForm.style.display = "none";
  ConfirmOverlay.style.display = "block";
}

function generateTicket(ticket) {
  let ticketRef = database.ref("Bookings/" + ticket);
  ticketRef.once('value', function(snapshot) { //Recursively generate unused ticket
    if (!snapshot.exists()) {
      pushToFirebase(ticket);
    } else {
      generateTicket(Math.round(Math.random() * 10000000));
    }
  });
}

addBookingListeners();