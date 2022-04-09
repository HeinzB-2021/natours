import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51KmG2QC90PvuAjkPkuwXjWm3WBtqfrlLQ7mJoxi1BwYJLuFtgSmXJInbdhoKPhZjDwwtMubcJlMLjYfm9gBcYFYy00nfA716W2'
  );
  try {
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    // console.log(err);
    showAlert('error', 'Booking hat nicht geklappt');
  }
};
