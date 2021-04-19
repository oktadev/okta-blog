describe('Okta CLI setup', () => {
  beforeEach(() => {
    cy.eyesOpen({
      browser: { width: 800, height: 600 },
    });
  });

  afterEach(() => {
    cy.eyesClose();
  });

  it('Okta CLI include', () => {
    cy.visit('/blog/setup');
    cy.eyesCheckWindow('How to Create an OIDC App');
    cy.eyesClose()
  });
});
