/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateFlight = `subscription OnCreateFlight {
  onCreateFlight {
    id
    departureDate
    departureAirportCode
    departureAirportName
    departureCity
    departureLocale
    arrivalDate
    arrivalAirportCode
    arrivalAirportName
    arrivalCity
    arrivalLocale
    ticketPrice
    ticketCurrency
    flightNumber
    seatAllocation
  }
}
`;
export const onUpdateFlight = `subscription OnUpdateFlight {
  onUpdateFlight {
    id
    departureDate
    departureAirportCode
    departureAirportName
    departureCity
    departureLocale
    arrivalDate
    arrivalAirportCode
    arrivalAirportName
    arrivalCity
    arrivalLocale
    ticketPrice
    ticketCurrency
    flightNumber
    seatAllocation
  }
}
`;
export const onDeleteFlight = `subscription OnDeleteFlight {
  onDeleteFlight {
    id
    departureDate
    departureAirportCode
    departureAirportName
    departureCity
    departureLocale
    arrivalDate
    arrivalAirportCode
    arrivalAirportName
    arrivalCity
    arrivalLocale
    ticketPrice
    ticketCurrency
    flightNumber
    seatAllocation
  }
}
`;
export const onCreateBooking = `subscription OnCreateBooking($customer: String) {
  onCreateBooking(customer: $customer) {
    id
    status
    inboundFlight {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatAllocation
    }
    outboundFlight {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatAllocation
    }
    paymentToken
    checkedIn
    customer
  }
}
`;
export const onUpdateBooking = `subscription OnUpdateBooking($customer: String) {
  onUpdateBooking(customer: $customer) {
    id
    status
    inboundFlight {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatAllocation
    }
    outboundFlight {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatAllocation
    }
    paymentToken
    checkedIn
    customer
  }
}
`;
export const onDeleteBooking = `subscription OnDeleteBooking($customer: String) {
  onDeleteBooking(customer: $customer) {
    id
    status
    inboundFlight {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatAllocation
    }
    outboundFlight {
      id
      departureDate
      departureAirportCode
      departureAirportName
      departureCity
      departureLocale
      arrivalDate
      arrivalAirportCode
      arrivalAirportName
      arrivalCity
      arrivalLocale
      ticketPrice
      ticketCurrency
      flightNumber
      seatAllocation
    }
    paymentToken
    checkedIn
    customer
  }
}
`;
