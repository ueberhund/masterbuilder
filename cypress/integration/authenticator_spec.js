describe('Authenticator:', function() {
    // Step 1: setup the application state
    beforeEach(function() {
      cy.visit('/');
    });
    
    describe('Sign In:', () => {
      it('allows a user to signin', () => {
  
        //Check to make sure the page has the right content
        cy.contains('Octank Reservation System');
      });
    });
  
  });