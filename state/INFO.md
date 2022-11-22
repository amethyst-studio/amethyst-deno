Used to control the state of authentication and user access control plane.

Users are managed and registered via this application. Administrators or API
calls can add/remove/set users with certain roles, groups, and attributes which
applications can reference for access.

Registered users are able to be given either a blank state, pre-defined
(default) access control variables, and other misc information.

Authentication will support SAML SSO with secure vendors and will base off of
the primary and verified email address with the vendor.

- Google OAuth google
- GitHub OAuth github
- GitLab OAuth gitlab
- Discord OAuth discord

Once authenticated, we will use the profile identifier to link the accounts. If
the account is not linked to a profile, the email will be used as an identifier.
If the email does not work, the request to auth will fail.

API will set a session cookie and provide a session token. The session token is
the API key and can be changed or revoked on the user profile.

general layout

state.domain.tld /oauth/PROVIDER_ID/start (start transaction) - Browser State
/oauth/PROVIDER_ID/connect (callback transaction) - Browser State /profile/view

(profile view) - Browser State /profile/edit (profile edit) - Browser State
/profile/state (profile json state) - Browser State or Session Lookup GET
/profile PATCH /profile

/admin/ (admin console, api to be determined) /admin/console/ (management
console) /admin/user/ (user admin - auth, roles, and attributes) - role
attributes and individual attributes are true/false. if it exists, true.
otherwise, false. no overrides by role or individual.

- /get/:id
- /update/:id
- /delete/:id /admin/role/ (role admin - groups of attributes)
- /create/:id
- /get/:id
- /update/:id
- /delete/:id /admin/attribute/ (attribute admin)
- /create/:id
- /get/:id
- /update/:id
- /delete/:id
