import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8085",
  realm: "identity-os",
  clientId: "identity-os-frontend",
});

export async function logoutFromKeycloak() {
  await keycloak.logout({
    redirectUri: `${window.location.origin}/`,
  });
}

export default keycloak;