import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8085",
  realm: "identity-os",
  clientId: "identity-os-frontend",
});

export default keycloak;