<template>
  <q-page>
    <flight-toolbar
      v-if="this.selectedFlight"
      :departure="this.selectedFlight.departureAirportCode"
      :arrival="this.selectedFlight.arrivalAirportCode"
    />
    <div class="flights">
      <div class="heading">
        <div class="q-headline text-primary text-center">
          Review your selection
        </div>
        <div class="loader" v-if="loading">
          <flight-loader></flight-loader>
        </div>
      </div>
      <flight-card v-if="this.selectedFlight" :details="this.selectedFlight" />
    </div>
    <div class="form__payment">
      <div class="text-center">
        <div class="form__header q-pt-md q-headline text-primary text-center">
          Payment details
        </div>
        <div class="form">
          <form>
            <input type="hidden" name="token" />
            <div class="group">
              <label for="name">
                <span class="text-secondary">Name</span>
                <input
                  v-model="form.name"
                  id="name"
                  name="name"
                  placeholder="Name on card"
                  class="form__input field"
                  required
                />
              </label>
              <label>
                <span class="text-secondary">Country</span>
                <div class="form__payment--country field">
                  <q-select
                    v-model="form.country"
                    class="q-pt-sm form__select"
                    filter
                    filter-placeholder="Country"
                    placeholder="Country"
                    :options="form.countryOptions"
                    hide-underline
                  />
                </div>
              </label>
              <label for="postcode">
                <span class="text-secondary">Postcode</span>
                <input
                  v-model="form.postcode"
                  id="postcode"
                  name="postcode"
                  placeholder="Postcode"
                  class="form__input field"
                  required
                />
              </label>
              <label>
                <span class="text-secondary">Card number</span>
                <div id="card-number-element" class="form__stripe field"></div>
              </label>
              <label>
                <span class="text-secondary">Expiry date</span>
                <div id="card-expiry-element" class="form__stripe field"></div>
              </label>
              <label>
                <span class="text-secondary">CVC</span>
                <div id="card-cvc-element" class="form__stripe field"></div>
              </label>
            </div>
            <div class="outcome">
              <div class="error text-bold text-secondary" v-if="token.error">
                {{ token.error.message }}
              </div>
            </div>
          </form>
        </div>
        <q-btn
          @click="payment"
          class="cta__button text-weight-medium"
          color="secondary"
          label="Agree and pay now"
          :disable="$v.form.$invalid || form.isCardInvalid"
        >
          <q-icon
            class="cta__button--direction"
            name="keyboard_arrow_right"
            size="2.6rem"
          />
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script>
// @ts-nocheck
import FlightCard from "../components/FlightCard";
import FlightToolbar from "../components/FlightToolbar";
import FlightClass from "../shared/models/FlightClass";
import FlightLoader from "../components/FlightLoader";
import { validationMixin } from "vuelidate";
import { required, minLength } from "vuelidate/lib/validators";
import { mapState, mapGetters } from "vuex";
import { createBooking } from "../graphql/mutations";
import { API, graphqlOperation } from 'aws-amplify';
import {
  processBooking as processBookingMutation,
  getBookingByStatus
} from "../graphql/mutations";
var stripe, card;

/**
 * Flight Selection view displays selected Flight chosen by customer in Flight Results view along with Payment procedure
 */
export default {
  name: "FlightSelection",
  /**
   * @param {Flight} flight - Selected Flight
   * @param {string} flightId - Selected Flight Unique Identifier
   */
  props: {
    flight: { type: FlightClass },
    flightId: { type: String, required: true }
  },
  components: {
    FlightCard,
    FlightToolbar,
    FlightLoader
  },
  mixins: [validationMixin],
  validations: {
    form: {
      name: {
        required
      },
      country: {
        required
      },
      postcode: {
        required,
        minLength: minLength(3)
      }
    }
  },
  /**
   * @param {boolean} isAuthenticated - Getter from Profile module
   * @param {boolean} loading - Loader state used to control Flight Loader when fetching flights
   */
  computed: {
    ...mapGetters({
      firstName: "profile/firstName",
      customer: "profile/userAttributes",
      isAuthenticated: "profile/isAuthenticated"
    }),
    ...mapState({
      loading: state => state.catalog.loading
    })
  },
  async beforeMount() {
    /** authentication guards prevent authenticated users to view Flights
     * however, the component doesn't stop from rendering asynchronously
     * this guarantees we attempt talking to Catalog service
     * if our authentication guards && profile module have an user in place
     */
    if (this.isAuthenticated) {
      if (!this.flight) {
        this.selectedFlight = await this.$store.dispatch(
          "catalog/fetchByFlightId",
          {
            flightId: this.flightId
          }
        );
      }
    }
  },
  mounted() {
    /**
     * Stripe JS is loaded into the DOM asynchronously
     * once loaded we attach Stripe Elements to custom DOM elements
     * that makes payment credit card collection seamless through iFrame while providing an unified experience
     */
    let stripeElements = this.loadStripeJS();
    stripeElements
      .then(() => this.loadStripeElements())
      .catch(err => console.error(err));
  },
  /**
   * @param {object} token - Stripe JS token object
   * @param {object} token.details - Stripe JS tokenized details
   * @param {object} token.error - Stripe JS error when attempting tokenization
   * @param {string} stripeKey - Public Stripe JS key for tokenization
   * @param {object} form - Form object holding some information and validation hooks
   * @param {string} form.name - Given contact name
   * @param {string} form.country - Given contact country
   * @param {object} form.countryOptions - List of countries we accept payment from
   * @param {boolean} isCardInvalid - Boolean updated through Stripe Elements events upon input
   * @param {Flight} selectedFlight - Selected Flight
   */
  data() {
    return {
      token: {
        details: "",
        error: ""
      },
      stripeKey: "pk_test_BpxANYCOZO7waMV3TrPQHjXa", // test key,
      form: {
        name: "",
        country: "",
        postcode: "",
        countryOptions: [
          {
            label: "United States",
            value: "US"
          },
          {
            label: "United Kingdom",
            value: "UK"
          }
        ],
        isCardInvalid: true
      },
      selectedFlight: this.flight
    };
  },
  methods: {
    /**
     * Tokenize form and credit card data, and make charge request against Payment service
     * Given a successful payment it attempts to create a booking with Booking service
     * If booking completes successfuly, it redirects the customer to the Bookings view
     */
    async payment() {
      let options = {
        name: this.form.name,
        address_zip: this.form.postcode,
        address_country: this.form.country
      };

      try {
        /*
        const bookingData = {
          customer: "f171aa56-c9f6-4542-81d5-97a47d8ee260",
          bookingOutboundFlightId: flightId,
          paymentToken: "token"
        };
        console.log(bookingData);
        */
        //let charge = await API.graphql(graphqlOperation(createBooking, bookingData));
        //const { token, error } = await stripe.createToken(card, options);
        //this.token.details = token;
        //this.token.error = error;

        //if (this.token.error) throw this.token.error;

        const processBookingInput = {
          input : {
            paymentToken : "token",
            bookingOutboundFlightId: "19f6a4c5-b150-4e8c-b902-5bdaad3a6491"
          }
        };
        console.log(processBookingInput);
        try {
          const { 
            // @ts-ignore
            data: {
              processBooking: {id: bookingProcessId}
            }
          } = await API.graphql(graphqlOperation(processBookingMutation, processBookingInput));
          //return bookingProcessId;
        } catch (err) {
          console.error(err);
          throw err;
        }

        await this.$store.dispatch("bookings/createBooking", {
          paymentToken: this.token,
          outboundFlight: this.flight
        });

        this.$q.loading.hide();
        this.$router.push({ name: "bookings" });
      } catch (err) {
        this.$q.loading.hide();
        console.error(err);
      }
    },
    /**
     * Injects Stripe JS library asynchronously into the DOM
     */
    loadStripeJS() {
      return new Promise((resolve, reject) => {
        let stripeScript = document.createElement("script");
        stripeScript.async = true;
        stripeScript.src = "https://js.stripe.com/v3/";
        stripeScript.addEventListener("load", resolve);
        stripeScript.addEventListener("error", () =>
          reject("Error loading Stripe Elements.")
        );
        stripeScript.addEventListener("abort", () =>
          reject("Stripe Elements loading aborted.")
        );
        document.head.appendChild(stripeScript);
      });
    },
    /**
     * Provides customer feedback upon Stripe Elements card data validation
     */
    updateCardFeedback(result) {
      this.token.error = result.error;
      this.form.isCardInvalid = !result.complete;
    },
    /**
     * Once Stripe JS is loaded it attaches Stripe Elements to existing DOM elements
     * It also customizes Stripe Elements UI to provide a consistent experience
     */
    loadStripeElements() {
      stripe = Stripe(this.stripeKey); // eslint-disable-line
      let elements = stripe.elements();
      let style = {
        base: {
          iconColor: "#666EE8",
          color: "#31325F",
          lineHeight: "40px",
          fontWeight: 300,
          fontFamily: "Helvetica Neue",
          fontSize: "15px",

          "::placeholder": {
            color: "#CFD7E0"
          }
        }
      };

      card = elements.create("cardNumber", {
        style: style
      });

      var cardExpiryElement = elements.create("cardExpiry", {
        style: style
      });

      var cardCvcElement = elements.create("cardCvc", {
        style: style
      });

      // Enable Stripe iFrame on each field
      card.mount("#card-number-element");
      cardExpiryElement.mount("#card-expiry-element");
      cardCvcElement.mount("#card-cvc-element");

      // Stripe Elements emit events upon card validation
      // Capture it and provide feedback to customer
      card.on("change", event => this.updateCardFeedback(event));
      cardExpiryElement.on("change", event => this.updateCardFeedback(event));
      cardCvcElement.on("change", event => this.updateCardFeedback(event));
    }
  }
};
</script>

<style lang="stylus" scoped>
@import '~variables'

.flights
  margin-top $content-toolbar-margin

.q-headline
  margin-top 2rem

.form__payment, .form__header
  background $grey-2

form
  width auto
  margin 20px

.group
  background white
  box-shadow 0 7px 14px 0 rgba(49, 49, 93, 0.1), 0 3px 6px 0 rgba(0, 0, 0, 0.08)
  border-radius 4px
  margin-bottom 20px

label
  position relative
  font-weight 300
  height 40px
  line-height 40px
  display flex

.group label:not(:last-child)
  border-bottom 1px solid #F0F5FA

label > span
  width 120px
  text-align right
  margin-right 0.4rem

.field
  background transparent
  font-weight 300
  border none
  color #31325F
  outline none
  flex 1
  padding-right 10px
  padding-left 10px
  cursor text

.field::-webkit-input-placeholder
  color #CFD7E0

.field::-moz-placeholder
  color #CFD7E0

.outcome
  float left
  width 100%
  padding-top 8px
  min-height 24px
  text-align center

.error
  font-size 20px

.error.visible
  display inline

.separator
  box-shadow 0 7px 14px 0 rgba(49, 49, 93, 0.1), 0 3px 6px 0 rgba(0, 0, 0, 0.08)

.loader
  width 150%
</style>
