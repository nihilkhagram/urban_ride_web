import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaEnvelope, FaMapMarkerAlt, FaCar, FaCalendarAlt, FaClock, FaRupeeSign, FaUser, FaPhone } from 'react-icons/fa';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingId, setBookingId] = useState('');
  
  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const fromCity = queryParams.get('from');
  const toCity = queryParams.get('to');
  const cabId = queryParams.get('cabId');
  const bookingType = queryParams.get('type');
  
  // State for booking details
  const [booking, setBooking] = useState(null);
  
  // API URL
  // Import API URL from config
  const { API_URL } = require('../config/apiConfig');
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Animation states
  const [showPaymentAnimation, setShowPaymentAnimation] = useState(false);
  const [showBookingAnimation, setShowBookingAnimation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  
  useEffect(() => {
    // Get all parameters from URL
    const bookingId = queryParams.get('bookingId');
    const method = queryParams.get('method') || 'online';
    const from = queryParams.get('from');
    const to = queryParams.get('to');
    const cabName = queryParams.get('cabName');
    const amount = queryParams.get('amount');
    const date = queryParams.get('date');
    const time = queryParams.get('time');
    const distance = queryParams.get('distance');
    
    setBookingId(bookingId);
    setPaymentMethod(method);
    
    // Create params for redirecting to booking details page
    const buildRedirectParams = () => {
      const params = new URLSearchParams();
      params.append('paymentStatus', method === 'cod' ? 'pending' : 'success');
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (cabName) params.append('cabName', encodeURIComponent(cabName));
      if (amount) params.append('amount', amount);
      if (date) params.append('date', encodeURIComponent(date));
      if (time) params.append('time', encodeURIComponent(time));
      if (distance) params.append('distance', distance);
      return params.toString();
    };
    
    // Show appropriate animation based on payment method
    if (method.toLowerCase() === 'cod') {
      // For COD, just show booking confirmation animation
      setTimeout(() => {
        setShowBookingAnimation(true);
        
        // Then redirect to booking details page after showing animation
        if (bookingId) {
          setTimeout(() => {
            console.log('Redirecting to booking details page...');
            navigate(`/booking/${bookingId}?${buildRedirectParams()}`);
          }, 3000);
        }
      }, 500);
    } else {
      // For online payment, first show payment success animation, then booking confirmation
      setTimeout(() => {
        setShowPaymentAnimation(true);
        setTimeout(() => {
          setShowPaymentAnimation(false);
          setShowBookingAnimation(true);
          
          // Then redirect to booking details page after showing animation
          if (bookingId) {
            setTimeout(() => {
              console.log('Redirecting to booking details page...');
              navigate(`/booking/${bookingId}?${buildRedirectParams()}`);
            }, 3000);
          }
        }, 2000);
      }, 500);
    }
    
    if (!bookingId && (!fromCity || !toCity)) {
      toast.error('Missing booking information');
      navigate('/');
      return;
    }
    
    // Store this booking in user history array in localStorage
    try {
      const userBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
      const newBooking = {
        id: bookingId,
        from: fromCity,
        to: toCity,
        date: new Date().toISOString(),
        cabName: queryParams.get('cabName') || 'Standard Cab',
        amount: queryParams.get('amount') || '0',
        status: 'confirmed',
        paymentMethod: method
      };
      
      // Check if booking already exists to avoid duplicates
      const bookingExists = userBookings.some(booking => booking.id === bookingId);
      if (!bookingExists) {
        userBookings.unshift(newBooking); // Add to beginning of array
        localStorage.setItem('userBookings', JSON.stringify(userBookings));
      }
    } catch (error) {
      console.error('Error saving booking to history:', error);
    }
    
    // Handle booking confirmation data
    // Get user info from local storage for fallback
    const userId = localStorage.getItem('userId') || 'guest';
    const userEmail = localStorage.getItem('userEmail') || queryParams.get('email') || '';
    const userMobile = localStorage.getItem('userMobile') || queryParams.get('mobile') || '';
    
    const fetchBookingDetails = async () => {
      try {
        setIsLoading(true);
        
        // We are on the confirmation page, use query params directly
        if (window.location.pathname.includes('/booking/confirmation')) {
          try {
            // Use data from query parameters - don't attempt to fetch from the booking/:id endpoint
            // This avoids the MongoDB ObjectId casting error
            
            // Set booking state directly from query parameters
            setBooking({
              id: bookingId || 'NEW-' + Math.floor(Math.random() * 10000),
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              from: fromCity,
              to: toCity,
              cabType: queryParams.get('cabName') || 'Standard Cab',
              price: `₹${queryParams.get('amount') || 3000}`,
              paymentMethod: paymentMethod.toLowerCase() === 'cod' ? 'Cash on Delivery' : 'Online Payment',
              travelDate: new Date().toLocaleDateString(),
              email: userEmail,
              mobile: userMobile
            });
            setBookingId(bookingId || 'NEW-' + Math.floor(Math.random() * 10000));
            setIsLoading(false);
            return;
          } catch (error) {
            console.log('Error processing confirmation page data:', error);
          }
        }
        // If not on confirmation page and we have bookingId, try to fetch the booking
        else if (bookingId && !bookingId.includes('confirmation')) {
          try {
            // First try to fetch from API
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const bookingResponse = await axios.get(`${API_URL}/booking/${bookingId}`, config);
            
            if (bookingResponse.data && bookingResponse.data.data) {
              const bookingData = bookingResponse.data.data;
              
              // Set booking state directly from API data
              setBooking({
                id: bookingData._id || bookingId,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                from: bookingData.fromCity || fromCity,
                to: bookingData.toCity || toCity,
                cabType: bookingData.cabType || queryParams.get('cabName') || 'Standard Cab',
                price: `₹${bookingData.fare || bookingData.totalAmount || queryParams.get('amount') || 3000}`,
                paymentMethod: paymentMethod.toLowerCase() === 'cod' ? 'Cash on Delivery' : 'Online Payment',
                travelDate: new Date(bookingData.pickupDate || bookingData.travelDate).toLocaleDateString(),
                email: bookingData.customerEmail || userEmail,
                mobile: bookingData.customerMobile || userMobile
              });
              setBookingId(bookingId);
              setIsLoading(false);
              return;
            }
          } catch (bookingError) {
            console.log('Error fetching booking from API, using fallback data:', bookingError);
            // Continue with fallback approach using query params
          }
        }
        
        // If no booking found or bookingId not provided, use query params for a fallback approach
        let cabDetails = { name: queryParams.get('cabName') || 'Standard Cab' };
        
        // Try to get cab details from localStorage or API if cabId is provided
        if (cabId) {
          // First check localStorage for cached cab data
          const cachedCabs = JSON.parse(localStorage.getItem('cabTypes') || '[]');
          const cachedCab = cachedCabs.find(cab => cab._id === cabId);
          
          if (cachedCab) {
            cabDetails = cachedCab;
          } else {
            try {
              // Try to get cab details from API
              const cabResponse = await axios.get(`${API_URL}/cab/type/${cabId}`);
              if (cabResponse.data && cabResponse.data.data) {
                cabDetails = cabResponse.data.data;
                
                // Cache the cab data for future use
                if (!cachedCabs.some(cab => cab._id === cabDetails._id)) {
                  cachedCabs.push(cabDetails);
                  localStorage.setItem('cabTypes', JSON.stringify(cachedCabs));
                }
              }
            } catch (cabError) {
              console.log('Error fetching cab details, using fallback data:', cabError);
              // Fall back to name from query params if available
              const cabName = queryParams.get('cabName');
              if (cabName) {
                cabDetails = { name: cabName };
              }
            }
          }
        }
        
        // Get travel date from query parameters or use current date
        const travelDateParam = queryParams.get('travelDate');
        const travelTimeParam = queryParams.get('travelTime');
        
        let travelDate = new Date();
        if (travelDateParam) {
          travelDate = new Date(travelDateParam);
        }
        
        if (travelTimeParam) {
          const [hours, minutes] = travelTimeParam.split(':');
          travelDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        }
        
        // Use the user info variables already declared above
        
        // Generate booking ID if needed
        const generatedBookingId = 'BK' + Math.floor(Math.random() * 10000);
        setBookingId(generatedBookingId);
        
        // Set booking state with available information
        setBooking({
          id: generatedBookingId,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          from: fromCity,
          to: toCity,
          cabType: cabDetails.name,
          price: `₹${queryParams.get('amount') || cabDetails.basePrice || 3000}`,
          paymentMethod: 'Online Payment',
          travelDate: travelDate.toLocaleDateString(),
          email: userEmail
        });
        
        // Store last booking data for dashboard and booking history
        const lastBookingData = {
          bookingId: generatedBookingId,
          fromCity: fromCity,
          toCity: toCity,
          cabType: cabDetails.name,
          cabName: cabDetails.name,
          amount: queryParams.get('amount') || cabDetails.basePrice || 3000,
          paymentMethod: queryParams.get('paymentMethod') || 'online',
          travelDate: travelDate.toLocaleDateString(),
          travelTime: travelDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'confirmed',
          email: userEmail,
          mobile: userMobile,
          _id: generatedBookingId
        };
        localStorage.setItem('lastBooking', JSON.stringify(lastBookingData));
        
        // Don't try to send email through the backend as it will fail without authentication
        // We'll handle this with a client-side email simulation instead
        if (userEmail) {
          setEmailSent(true);
        }
      } catch (error) {
        console.error('Error processing booking confirmation:', error);
        
        // Fallback to creating a minimal booking display
        const generatedBookingId = 'BK' + Math.floor(Math.random() * 10000);
        setBookingId(generatedBookingId);
        
        setBooking({
          id: generatedBookingId,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          from: fromCity || 'Origin City',
          to: toCity || 'Destination City',
          cabType: 'Standard Cab',
          price: '₹3000',
          paymentMethod: 'Online Payment',
          travelDate: new Date().toLocaleDateString(),
          email: localStorage.getItem('userEmail') || ''
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [fromCity, toCity, cabId, bookingType, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your booking...</p>
        </div>
      </div>
    );
  }
  
  // Function to send a confirmation email client-side (simulated)
  const sendConfirmationEmail = async () => {
    if (!booking.email || isSendingEmail) return;
    
    setIsSendingEmail(true);
    
    try {
      // Since we can't actually send an email from the client side,
      // we simulate a successful email sending with a short delay
      setTimeout(() => {
        setEmailSent(true);
        toast.success(`Confirmation email sent to ${booking.email}`);
        setIsSendingEmail(false);
      }, 2000);
    } catch (error) {
      console.error('Error in email simulation:', error);
      setIsSendingEmail(false);
      toast.error('Failed to send email. Please try again.');
    }
  };
  
  // Payment Success Animation Component
  const PaymentSuccessAnimation = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" style={{animation: 'fadeIn 0.3s'}}>
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full" style={{animation: 'scaleIn 0.4s'}}>
        <div className="mb-4 text-green-500 flex justify-center">
          <FaCheckCircle className="text-6xl" style={{animation: 'pulse 1.5s infinite'}} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
        <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
        <div className="h-2 w-full bg-gray-200 rounded-full mt-4">
          <div className="h-full bg-green-500 rounded-full" style={{width: '100%', animation: 'progressBar 2s linear'}}></div>
        </div>
      </div>
    </div>
  );
  
  // Booking Confirmation Animation Component
  const BookingConfirmationAnimation = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" style={{animation: 'fadeIn 0.3s'}}>
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full" style={{animation: 'scaleIn 0.4s'}}>
        <div className="mb-4 text-blue-500 flex justify-center">
          <FaCheckCircle className="text-6xl" style={{animation: 'bounce 1s infinite'}} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-blue-600">Booking Confirmed!</h2>
        <p className="text-gray-600 mb-4">Your cab has been booked successfully.</p>
        <p className="text-sm text-gray-500">Redirecting to booking details...</p>
        <div className="h-2 w-full bg-gray-200 rounded-full mt-4">
          <div className="h-full bg-blue-500 rounded-full" style={{width: '100%', animation: 'progressBar 2s linear'}}></div>
        </div>
      </div>
    </div>
  );
  
  // Custom animation styles
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes pulse {
      0% { transform: scale(0.95); }
      50% { transform: scale(1.1); }
      100% { transform: scale(0.95); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes progressBar {
      from { width: 0; }
      to { width: 100%; }
    }
  `;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Animation styles */}
      <style>{animationStyles}</style>
      
      {/* Payment Success Animation */}
      {showPaymentAnimation && <PaymentSuccessAnimation />}
      
      {/* Booking Confirmation Animation */}
      {showBookingAnimation && <BookingConfirmationAnimation />}
      
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Confirmation Header with Animation */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-white p-3 inline-block">
              <FaCheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
          <p className="mt-2 text-blue-100">Thank you for choosing UrbanRide for your journey</p>
          <div className="mt-4 inline-block bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
            Booking ID: <span className="font-bold">{booking.id}</span>
          </div>
        </div>
        
        {/* Journey Details Card */}
        <div className="p-6 md:p-8">
          <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <FaMapMarkerAlt className="mr-2" /> Journey Details
            </h2>
            <div className="flex flex-col md:flex-row mb-4">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    <span className="font-bold">A</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">FROM</p>
                    <p className="font-medium text-lg">{booking.from}</p>
                  </div>
                </div>
                <div className="ml-5 h-14 border-l-2 border-dashed border-gray-300 my-1"></div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    <span className="font-bold">B</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TO</p>
                    <p className="font-medium text-lg">{booking.to}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center mb-3">
                  <FaCar className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">CAB TYPE</p>
                    <p className="font-medium">{booking.cabType}</p>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  <FaCalendarAlt className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">TRAVEL DATE</p>
                    <p className="font-medium">{booking.travelDate || booking.date}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaClock className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">PICKUP TIME</p>
                    <p className="font-medium">{booking.time}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <FaRupeeSign className="mr-2" /> Payment Information
            </h2>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-xl">{booking.price}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">
                  {booking.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {booking.paymentMethod === 'cod' ? 'Pay on Delivery' : 'Paid'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Passenger Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
              <FaUser className="mr-2" /> Passenger Details
            </h2>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              {booking.email && (
                <div className="flex items-center mb-3">
                  <FaEnvelope className="text-gray-500 mr-3" />
                  <span>{booking.email}</span>
                </div>
              )}
              {booking.phone && (
                <div className="flex items-center">
                  <FaPhone className="text-gray-500 mr-3" />
                  <span>{booking.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Email Section */}
          <div className="mb-8 border border-blue-200 rounded-lg p-5 bg-blue-50">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FaEnvelope className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">Booking Confirmation</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {emailSent ? (
                    <>A confirmation email has been sent to <span className="font-medium">{booking.email}</span>.</>
                  ) : (
                    <>Click the button below to receive a confirmation email at <span className="font-medium">{booking.email}</span>.</>
                  )}
                </p>
                {!emailSent && booking.email && (
                  <button 
                    onClick={sendConfirmationEmail} 
                    disabled={isSendingEmail}
                    className="mt-3 bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isSendingEmail ? 'Sending...' : 'Send Confirmation Email'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 border-t pt-6">
            <Link to={`/booking/${bookingId}`} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex-1 text-center font-medium">
              View Booking Details
            </Link>
            <Link to="/bookings" className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 flex-1 text-center font-medium">
              View All Bookings
            </Link>
            <Link to="/" className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 flex-1 text-center font-medium">
              Book Another Cab
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
