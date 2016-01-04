


var lock = new Auth0Lock('5MaAedksdNlpmHsfj8vd7e40XOoMLgyz', 'tazcarper.auth0.com');
$( document ).ready(function() {
	console.log(localStorage)
document.getElementById('btn-login').addEventListener('click', function() {
  lock.show(function(err, profile, token) {
    if (err) {
      // Error callback
      console.error("Something went wrong: ", err);
      alert("Something went wrong, check the Console errors");
    } else {
      // Success calback  

      // Save the JWT token.
      localStorage.setItem('userToken', token);

      // Save the profile
      var userProfile = profile;
      console.log(userProfile.name)
     $('#nick').text(userProfile);
    }
  });
});
});
