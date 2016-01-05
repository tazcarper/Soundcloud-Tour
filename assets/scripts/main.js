var lock = new Auth0Lock('5MaAedksdNlpmHsfj8vd7e40XOoMLgyz', 'tazcarper.auth0.com');
var clientID = '?client_id=1bc3231f89579a25c82de840167ecd14';
var user_data = {
  SC_artists: [],
  songkick: [],
  bandpage: [],
  following_count: 0,
  city: '',
  web_profiles: [],
  name: ''
}
var events = [];
$(document).ready(function() {

  

  buildList = function() {
      var user = localStorage.getItem('userInfo');
      $.getJSON(user + clientID, function(me) {
      console.log(me);
      user_data.avatar = me.avatar_url;
      user_data.following_count = me.followings_count;
      user_data.name = me.username;
      user_data.avatar = me.avatar_url;
      localStorage.setItem('userName', user_data.name);

      console.log(user_data.following_count);
      
    });
      $.getJSON(user + '/followings' + clientID + '&limit=200&offset=8000', function(following) {

        //console.log(following)
        $.each(following.collection, function(key, val) {
          //console.log(val)
          user_data.SC_artists.push([val.id]);
          user_data.SC_artists[key].push(val.avatar_url);
          user_data.SC_artists[key].push(val.username);

        });

        console.log(user_data.SC_artists);
        console.log(user_data.SC_artists.length)
        var profileLimit = 0;
        var hitCount = 0;
        $.each(user_data.SC_artists, function(ke, va) {
          $.getJSON("https://api.soundcloud.com/users/" + va[0] + "/web-profiles" + clientID , function(profile) {
            var pic = va[1];
            var name = va[2];
            
          
            // var theKey = ke;
            user_data.web_profiles.push(profile);

            $.each(profile, function(k, v) {
              if (v.service == 'songkick') {
                // add user id
                user_data.songkick.push([v.username]);
                // add soundcloud avatar
                user_data.songkick[hitCount].push(pic);
                user_data.songkick[hitCount].push(name);
                // increase count for array
                hitCount++;
              }
              if (v.service == 'bandpage') {
                //console.log('has bandpage');
                user_data.bandpage.push(v.id);
              }

            });
            profileLimit++;
            
            // After it's gone through all the artists and collected which ones have tour attached.
            if (profileLimit == user_data.SC_artists.length) {
              // run sonkick function
              console.log('limit hit')
                //console.log(user_data.songkick);
                //console.log(user_data.bandpage);
                console.log(user_data.songkick);
              checkSongKick(user_data.songkick);
            }
          })
        });
      });
    }

    checkSongKick = function(ids) {

      var limit = 0;
      console.log(ids);
      console.log('Looking up SongKick dates');
      $.each(ids, function(k, v) {
        //console.log(v);
        console.log('...');
        $.getJSON("https://api.songkick.com/api/3.0/artists/" + v[0] + "/calendar.json?apikey=NyHcJHQPyD0gM5Ec&jsoncallback=?", function(data) {
          //console.log(data);
          $.each(data.resultsPage.results, function(key, evt) {
            //console.log(key);
            //console.log(evt);
            $.each(evt, function(k, val) {
              console.log(val);
              var event_detail = {
                concert_id: val.id,
                concert_avatar: v[1],
                artist_name: v[2],
                concert_name: val.displayName,
                concert_type: val.type,
                concert_date: val.start.date,
                concert_time: val.start.time,
                concert_city: val.location.city,
                concert_zip: val.venue.zip,
                concert_street: val.venue.street,
                concert_age: val.ageRestrictions,
                concert_lineup: val.performance,
                concert_venueName: val.venue.displayName,
                concert_venue_coord: {
                  'lat': val.venue.lat,
                  'lng': val.venue.lng
                },
                concert_venue_uri: val.venue.uri,
                concert_ticket: val.uri

              };
              events.push(event_detail);

            });

          });

        }).done(function() {
          if (k == ids.length - 1) {
            console.log('DONE! Here is the list of dates in order');
            //console.log(events);
            $.each(events, function(k, v) {

              //console.log(v.concert_venue_coord);
              v.miles = getDistances(v.concert_venue_coord);

            });
            events.sort(function(a, b) {
              // Turn your strings into dates, and then subtract them
              // to get a value that is either negative, positive, or zero.
              return new Date(a.concert_date) - new Date(b.concert_date);
            });


            showList(events)

          }
        });

      });



    }

    var showList = function(list) {
      var limit = 0;



      $.each(list, function(k, v) {
        convertTime(v);

        // build lineup
        var theLineup = [];

        // loop through each band in lineup
        $.each(v.concert_lineup, function(key, band) {
          theLineup.push(band.displayName);
        });

        // create new lineup list of artists
        var artists = theLineup.join(' - ');
        console.log(v);
        // change avatar to 300x300. Large is 100x100. Can go up to 500x500 with -t500x500
        //v.concert_avatar = v.concert_avatar.replace('-large', '-t300x300');
        v.concert_avatar = v.concert_avatar.replace('-large', '-t300x300');

        // name of show
        var concert = '<h2>' + v.concert_name + '</h2>';

        // Type of Concert
        var typeOfConcert = '<div class="type">';
        if (v.concert_type == 'Festival') {
          typeOfConcert = '<div class="type festival">';
        }

        // Concert or festival
        var concertString = typeOfConcert + '<p>' + v.concert_type + '</p></div>';

        // City of concert
        var location = '<h2 class="locationText">' + v.concert_city + '</h2>';

        // convert dates to readable format
        var convertedDate = convertDates(v.concert_date);

        // collapse ID
        var collapseID = v.concert_id + v.artist_name.replace(/[^A-Za-z0-9]/g, '_');

        if (v.concert_venue_uri == null) {
          //console.log('dunno venue')
          v.concert_venueName = '';
        }
        // build event and append to DOM

        // first layout
        var anEvent = '<div class="col-sm-12 anEvent" data-miles="' + v.miles + '">' + concertString + '<div class="row">' +
          '<div class="col-sm-2 col-xs-4 avatar" data-toggle="collapse" href="#' + collapseID + '" aria-expanded="true" aria-controls="' + collapseID + '">' +
          '<div class="captionContainer"><img src="' + v.concert_avatar + '" alt="' + v.artist_name + '"><div class="caption">More Info</div></div></div>' +
          '<div class="col-sm-10 col-xs-8 info"><div class="row"><div class="col-sm-8 who ">' +
          '<h1>' + v.artist_name + '</h1>' + concert + location + '<h3 class="where_venue"><a target="_blank" href="' + v.concert_venue_uri + '">' + v.concert_venueName + '</a></h3></div>' +
          '<div class="col-sm-1 col-xs-6 where">' +
          '</div>' +
          '<div class="col-sm-3 col-xs-12 tickets"><h3>' + convertedDate + '</h3><h3 class="concert_timeing">' + v.concert_time + '</h3>' +
          '<a href="' + v.concert_ticket + '" target="_blank"><button class="btn btn-default tickets">Get Tickets</button></a>' +
          '<a class="moreInfo">More Info >> </a></div>' +
          '<div class="col-sm-12 col-xs-6 bigList"><h4>Who&rsquo;s playing:</h4><p>' + artists + '</p></div>' +
          '</div></div></div>' +
          '<div class="collapse" role="tabpanel" id="' + collapseID + '"><div class="row  expandedContent" >' +
          '<div class="col-sm-12 col-xs-6 "></div></div></div></div>';

        // 2nd layout
        var anEvent_2 = '<div class="col-md-6 anEvent">' + concertString + '<div class="row"><div class="innerPad">' +
          '<div class="col-md-4 col-xs-3 avatar">' +
          '<img src="' + v.concert_avatar + '" alt="' + v.artist_name + '"></div>' +
          '<div class="col-md-4 col-xs-8">' +
          '<h1>' + v.artist_name + '</h1><h3>' + convertedDate + '</h3><h3>' + v.concert_time + '</h3></div>' +
          '<div class="col-md-4 col-xs-3">' + location +
          '</div><a class="buyTicket" href="' + v.concert_ticket + '" target="_blank"><button class="btn btn-default tickets">Find Tickets</button></a></div></div></div>';

        $('.tourList').append($.parseHTML(anEvent));
        limit++;

        $('.cityLocation').text(user_data.city);

        $('.welcome').text(user_data.name);

        $('.user_avatar img').attr('src', user_data.avatar);

        if (limit == list.length) {
          // fade out loading screen and hide it
          $('.loading').css({
            'opacity': 0
          });
          setTimeout(function() {
            $('.loading').hide()
          }, 750);
        }
      });

    }


    convertTime = function(v) {
      // convert miltary time

      // if time isn't listed, leave blank
      if (v.concert_time == null) {
        v.concert_time = '';
      } else {
        var timeSplit = v.concert_time.split(":");
        var d = new Date();
        d.setHours(timeSplit[0], timeSplit[1], timeSplit[2]);
        var hours = d.getHours();
        var am = true;
        if (hours > 12) {
          am = false;
          hours -= 12;
        }
        if (hours == 12) {
          am = false;
        }
        if (hours == 0) {
          hours = 12;
        }

        var minute = d.getMinutes();

        if (minute == "0") {
          minute = "00";
        }
        v.concert_time = hours + ':' + minute + ' ' + (am ? "A.M." : "P.M.");
      }
    }

    monthName = function(num) {
      // strip 0 from 01, 02, 03 ect...
      num = num.replace(/^0+/, '') - 1;
      var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return monthNames[num];
    }

    convertDates = function(date) {
      // convert date to month, day ( March, 7)
      var newDate = date.split('-');

      var year = newDate[0];
      var month = monthName(newDate[1]);
      var day = newDate[2];
      return month + ' ' + day;
    }

    // to do!
    signOut = function() {

    }

    getDistances = function(venue_coord) {


      if (venue_coord['lat'] !== null) {
        var distance = geolib.getDistance(start, venue_coord);
        distance = geolib.convertUnit('mi', distance, 0);
        //console.log('distance from home is ' + distance + ' miles.');
      }
      return distance;

    }

    getGeoInfo = function() {
      //  get users ip / long / lat
      var user_long, user_lat;
      $.ajax({
        url: '//freegeoip.net/json/',
        type: 'POST',
        dataType: 'jsonp',
        success: function(location) {
          // example where I update content on the page.
          console.log(location);
          user_lat = location.latitude;
          user_long = location.longitude;
          // set starting long/lat object
          start = {
            lat: location.latitude,
            lng: location.longitude
          };
          console.log(start);
          // get closest city
          $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + start.lat + ',' + start.lng + '&key=AIzaSyAGsXd49uewU9VJY2PN9rchVLClqXbdTXo', function(data) {
            console.log(data.results[4].address_components[0].long_name);
            console.log(data.results[5].address_components[0].long_name);
            user_data.city = data.results[4].address_components[0].long_name + ', ' + data.results[5].address_components[0].long_name;

          })
        }
      }).done(function() {

      });

    }

    if (localStorage.userToken) {


    
    buildList();
  } else {

  }
    //SIGN IN
  document.getElementById('btn-login').addEventListener('click', function() {
    lock.show(function(err, profile, token) {
      if (err) {
        // Error callback
        console.error("Something went wrong: ", err);
        alert("Something went wrong, check the Console errors");
      } else {
        // Success calback  

        // Save the JWT token.
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        localStorage.setItem('userToken', token);

        // Save the profile
        var userProfile = profile;
        console.log(userProfile)
        localStorage.setItem('userInfo', userProfile.uri);
        console.log(localStorage.getItem('userInfo'))
        buildList();
      }
    });
  });
  // SIGN OUT
  $('#signOut').click(function(e) {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    window.location.href = "/";
  });
  getGeoInfo();
});

;(function(global, undefined) {

  "use strict";

  function Geolib() {}

  // Setting readonly defaults
  var geolib = Object.create(Geolib.prototype, {
    version: {
      value: "$version$"
    },
    radius: {
      value: 6378137
    },
    minLat: {
      value: -90
    },
    maxLat: {
      value: 90
    },
    minLon: {
      value: -180
    },
    maxLon: {
      value: 180
    },
    sexagesimalPattern: {
      value: /^([0-9]{1,3})°\s*([0-9]{1,3}(?:\.(?:[0-9]{1,2}))?)'\s*(([0-9]{1,3}(\.([0-9]{1,2}))?)"\s*)?([NEOSW]?)$/
    },
    measures: {
      value: Object.create(Object.prototype, {
        "m" : {value: 1},
        "km": {value: 0.001},
        "cm": {value: 100},
        "mm": {value: 1000},
        "mi": {value: (1 / 1609.344)},
        "sm": {value: (1 / 1852.216)},
        "ft": {value: (100 / 30.48)},
        "in": {value: (100 / 2.54)},
        "yd": {value: (1 / 0.9144)}
      })
    },
    prototype: {
      value: Geolib.prototype
    },
    extend: {
      value: function(methods, overwrite) {
        for(var prop in methods) {
          if(typeof geolib.prototype[prop] === 'undefined' || overwrite === true) {
            geolib.prototype[prop] = methods[prop];
          }
        }
      }
    }
  });

  if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
      return this * Math.PI / 180;
    };
  }

  if (typeof(Number.prototype.toDeg) === "undefined") {
    Number.prototype.toDeg = function() {
      return this * 180 / Math.PI;
    };
  }

  // Here comes the magic
  geolib.extend({

    decimal: {},

    sexagesimal: {},

    distance: null,

    getKeys: function(point) {

      // GeoJSON Array [longitude, latitude(, elevation)]
      if(Object.prototype.toString.call(point) == '[object Array]') {

        return {
          longitude: point.length >= 1 ? 0 : undefined,
          latitude: point.length >= 2 ? 1 : undefined,
          elevation: point.length >= 3 ? 2 : undefined
        };

      }

      var getKey = function(possibleValues) {

        var key;

        possibleValues.every(function(val) {
          // TODO: check if point is an object
          if(typeof point != 'object') {
            return true;
          }
          return point.hasOwnProperty(val) ? (function() { key = val; return false; }()) : true;
        });

        return key;

      };

      var longitude = getKey(['lng', 'lon', 'longitude']);
      var latitude = getKey(['lat', 'latitude']);
      var elevation = getKey(['alt', 'altitude', 'elevation', 'elev']);

      // return undefined if not at least one valid property was found
      if(typeof latitude == 'undefined' && 
        typeof longitude == 'undefined' && 
        typeof elevation == 'undefined') {
        return undefined;
      }

      return {
        latitude: latitude,
        longitude: longitude,
        elevation: elevation
      };

    },

    // returns latitude of a given point, converted to decimal
    // set raw to true to avoid conversion
    getLat: function(point, raw) {
      return raw === true ? point[this.getKeys(point).latitude] : this.useDecimal(point[this.getKeys(point).latitude]);
    },

    // Alias for getLat
    latitude: function(point) {
      return this.getLat.call(this, point);
    },

    // returns longitude of a given point, converted to decimal
    // set raw to true to avoid conversion
    getLon: function(point, raw) {
      return raw === true ? point[this.getKeys(point).longitude] : this.useDecimal(point[this.getKeys(point).longitude]);
    },

    // Alias for getLon
    longitude: function(point) {
      return this.getLon.call(this, point);
    },

    getElev: function(point) {
      return point[this.getKeys(point).elevation];
    },

    // Alias for getElev
    elevation: function(point) {
      return this.getElev.call(this, point);
    },

    coords: function(point, raw) {

      var retval = {
        latitude: raw === true ? point[this.getKeys(point).latitude] : this.useDecimal(point[this.getKeys(point).latitude]),
        longitude: raw === true ? point[this.getKeys(point).longitude] : this.useDecimal(point[this.getKeys(point).longitude])
      };

      var elev = point[this.getKeys(point).elevation];

      if(typeof elev !== 'undefined') {
        retval['elevation'] = elev;
      }

      return retval;

    },

    // Alias for coords
    ll: function(point, raw) {
      return this.coords.call(this, point, raw);
    },


    // checks if a variable contains a valid latlong object
    validate: function(point) {

      var keys = this.getKeys(point);

      if(typeof keys === 'undefined' || typeof keys.latitude === 'undefined' || keys.longitude === 'undefined') {
        return false;
      }

      var lat = point[keys.latitude];
      var lng = point[keys.longitude];

      if(typeof lat === 'undefined' || !this.isDecimal(lat) && !this.isSexagesimal(lat)) {
        return false;
      }

      if(typeof lng === 'undefined' || !this.isDecimal(lng) && !this.isSexagesimal(lng)) {
        return false;
      }

      lat = this.useDecimal(lat);
      lng = this.useDecimal(lng);

      if(lat < this.minLat || lat > this.maxLat || lng < this.minLon || lng > this.maxLon) {
        return false;
      }

      return true;

    },

    /**
    * Calculates geodetic distance between two points specified by latitude/longitude using 
    * Vincenty inverse formula for ellipsoids
    * Vincenty Inverse Solution of Geodesics on the Ellipsoid (c) Chris Veness 2002-2010
    * (Licensed under CC BY 3.0)
    *
    * @param    object    Start position {latitude: 123, longitude: 123}
    * @param    object    End position {latitude: 123, longitude: 123}
    * @param    integer   Accuracy (in meters)
    * @return   integer   Distance (in meters)
    */
    getDistance: function(start, end, accuracy) {

      accuracy = Math.floor(accuracy) || 1;

      var s = this.coords(start);
      var e = this.coords(end);

      var a = 6378137, b = 6356752.314245,  f = 1/298.257223563;  // WGS-84 ellipsoid params
      var L = (e['longitude']-s['longitude']).toRad();

      var cosSigma, sigma, sinAlpha, cosSqAlpha, cos2SigmaM, sinSigma;

      var U1 = Math.atan((1-f) * Math.tan(parseFloat(s['latitude']).toRad()));
      var U2 = Math.atan((1-f) * Math.tan(parseFloat(e['latitude']).toRad()));
      var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
      var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

      var lambda = L, lambdaP, iterLimit = 100;
      do {
        var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
        sinSigma = (
          Math.sqrt(
            (
              cosU2 * sinLambda
            ) * (
              cosU2 * sinLambda
            ) + (
              cosU1 * sinU2 - sinU1 * cosU2 * cosLambda
            ) * (
              cosU1 * sinU2 - sinU1 * cosU2 * cosLambda
            )
          )
        );
        if (sinSigma === 0) {
          return geolib.distance = 0;  // co-incident points
        }

        cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
        sigma = Math.atan2(sinSigma, cosSigma);
        sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
        cosSqAlpha = 1 - sinAlpha * sinAlpha;
        cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;

        if (isNaN(cos2SigmaM)) {
          cos2SigmaM = 0;  // equatorial line: cosSqAlpha=0 (§6)
        }
        var C = (
          f / 16 * cosSqAlpha * (
            4 + f * (
              4 - 3 * cosSqAlpha
            )
          )
        );
        lambdaP = lambda;
        lambda = (
          L + (
            1 - C
          ) * f * sinAlpha * (
            sigma + C * sinSigma * (
              cos2SigmaM + C * cosSigma * (
                -1 + 2 * cos2SigmaM * cos2SigmaM
              )
            )
          )
        );

      } while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0);

      if (iterLimit === 0) {
        return NaN;  // formula failed to converge
      }

      var uSq = (
        cosSqAlpha * (
          a * a - b * b
        ) / (
          b*b
        )
      );

      var A = (
        1 + uSq / 16384 * (
          4096 + uSq * (
            -768 + uSq * (
              320 - 175 * uSq
            )
          )
        )
      );

      var B = (
        uSq / 1024 * (
          256 + uSq * (
            -128 + uSq * (
              74-47 * uSq
            )
          )
        )
      );

      var deltaSigma = (
        B * sinSigma * (
          cos2SigmaM + B / 4 * (
            cosSigma * (
              -1 + 2 * cos2SigmaM * cos2SigmaM
            ) -B / 6 * cos2SigmaM * (
              -3 + 4 * sinSigma * sinSigma
            ) * (
              -3 + 4 * cos2SigmaM * cos2SigmaM
            )
          )
        )
      );

      var distance = b * A * (sigma - deltaSigma);

      distance = distance.toFixed(3); // round to 1mm precision

      //if (start.hasOwnProperty(elevation) && end.hasOwnProperty(elevation)) {
      if (typeof this.elevation(start) !== 'undefined' && typeof this.elevation(end) !== 'undefined') {
        var climb = Math.abs(this.elevation(start) - this.elevation(end));
        distance = Math.sqrt(distance * distance + climb * climb);
      }

      return this.distance = Math.floor(
        Math.round(distance / accuracy) * accuracy
      );

      /*
      // note: to return initial/final bearings in addition to distance, use something like:
      var fwdAz = Math.atan2(cosU2*sinLambda,  cosU1*sinU2-sinU1*cosU2*cosLambda);
      var revAz = Math.atan2(cosU1*sinLambda, -sinU1*cosU2+cosU1*sinU2*cosLambda);

      return { distance: s, initialBearing: fwdAz.toDeg(), finalBearing: revAz.toDeg() };
      */

    },


    /**
    * Calculates the distance between two spots. 
    * This method is more simple but also far more inaccurate
    *
    * @param    object    Start position {latitude: 123, longitude: 123}
    * @param    object    End position {latitude: 123, longitude: 123}
    * @param    integer   Accuracy (in meters)
    * @return   integer   Distance (in meters)
    */
    getDistanceSimple: function(start, end, accuracy) {

      accuracy = Math.floor(accuracy) || 1;

      var distance = 
        Math.round(
          Math.acos(
            Math.sin(
              this.latitude(end).toRad()
            ) * 
            Math.sin(
              this.latitude(start).toRad()
            ) + 
            Math.cos(
              this.latitude(end).toRad()
            ) * 
            Math.cos(
              this.latitude(start).toRad()
            ) * 
            Math.cos(
              this.longitude(start).toRad() - this.longitude(end).toRad()
            ) 
          ) * this.radius
        );

      return geolib.distance = Math.floor(Math.round(distance/accuracy)*accuracy);

    },




    /**
    * Sorts an array of coords by distance from a reference coordinate
    *
    * @param    object    reference coordinate e.g. {latitude: 51.5023, longitude: 7.3815}
    * @param    mixed   array or object with coords [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...] 
    * @return   array   ordered array
    */
    orderByDistance: function(latlng, coords) {

      var coordsArray = [];

      for(var coord in coords) {

        var d = this.getDistance(latlng, coords[coord]);

        coordsArray.push({
          key: coord, 
          latitude: this.latitude(coords[coord]), 
          longitude: this.longitude(coords[coord]), 
          distance: d
        });

      }

      return coordsArray.sort(function(a, b) { return a.distance - b.distance; });

    },


    /**
    * Finds the nearest coordinate to a reference coordinate
    *
    * @param    object    reference coordinate e.g. {latitude: 51.5023, longitude: 7.3815}
    * @param    mixed   array or object with coords [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...] 
    * @return   array   ordered array
    */
    findNearest: function(latlng, coords, offset, limit) {

      offset = offset || 0;
      limit = limit || 1;
      var ordered = this.orderByDistance(latlng, coords);

      if(limit === 1) {
        return ordered[offset];
      } else {
        return ordered.splice(offset, limit);
      }

    },


    /**
    * Calculates the length of a given path
    *
    * @param    mixed   array or object with coords [{latitude: 51.5143, longitude: 7.4138}, {latitude: 123, longitude: 123}, ...] 
    * @return   integer   length of the path (in meters)
    */
    getPathLength: function(coords) {

      var dist = 0;
      var last;

      for (var i = 0, l = coords.length; i < l; ++i) {
        if(last) {
          //console.log(coords[i], last, this.getDistance(coords[i], last));
          dist += this.getDistance(this.coords(coords[i]), last);
        }
        last = this.coords(coords[i]);
      }

      return dist;

    },


    /**
    * Calculates the speed between to points within a given time span.
    *
    * @param    object    coords with javascript timestamp {latitude: 51.5143, longitude: 7.4138, time: 1360231200880}
    * @param    object    coords with javascript timestamp {latitude: 51.5502, longitude: 7.4323, time: 1360245600460}
    * @param    object    options (currently "unit" is the only option. Default: km(h));
    * @return   float   speed in unit per hour
    */
    getSpeed: function(start, end, options) {

      var unit = options && options.unit || 'km';

      if(unit == 'mph') {
        unit = 'mi';
      } else if(unit == 'kmh') {
        unit = 'km';
      }

      var distance = geolib.getDistance(start, end);
      var time = ((end.time*1)/1000) - ((start.time*1)/1000);
      var mPerHr = (distance/time)*3600;
      var speed = Math.round(mPerHr * this.measures[unit] * 10000)/10000;
      return speed;

    },


    /**
    * Converts a distance from meters to km, mm, cm, mi, ft, in or yd
    *
    * @param    string    Format to be converted in
    * @param    float   Distance in meters
    * @param    float   Decimal places for rounding (default: 4)
    * @return   float   Converted distance
    */
    convertUnit: function(unit, distance, round) {

      if(distance === 0 || typeof distance === 'undefined') {

        if(this.distance === 0) {
          // throw 'No distance given.';
          return 0;
        } else {
          distance = this.distance;
        }

      }

      unit = unit || 'm';
      round = (null == round ? 4 : round);

      if(typeof this.measures[unit] !== 'undefined') {
        return this.round(distance * this.measures[unit], round);
      } else {
        throw new Error('Unknown unit for conversion.');
      }

    },


    /**
    * Checks if a value is in decimal format or, if neccessary, converts to decimal
    *
    * @param    mixed   Value(s) to be checked/converted (array of latlng objects, latlng object, sexagesimal string, float)
    * @return   float   Input data in decimal format
    */
    useDecimal: function(value) {

      if(Object.prototype.toString.call(value) === '[object Array]') {

        var geolib = this;

        value = value.map(function(val) {

          //if(!isNaN(parseFloat(val))) {
          if(geolib.isDecimal(val)) {

            return geolib.useDecimal(val);

          } else if(typeof val == 'object') {

            if(geolib.validate(val)) {

              return geolib.coords(val);

            } else {

              for(var prop in val) {
                val[prop] = geolib.useDecimal(val[prop]);
              }

              return val;

            }

          } else if(geolib.isSexagesimal(val)) {

            return geolib.sexagesimal2decimal(val);

          } else {

            return val;

          }

        });

        return value;

      } else if(typeof value === 'object' && this.validate(value)) {

        return this.coords(value);

      } else if(typeof value === 'object') {

        for(var prop in value) {
          value[prop] = this.useDecimal(value[prop]);
        }

        return value;

      }


      if (this.isDecimal(value)) {

        return parseFloat(value);

      } else if(this.isSexagesimal(value) === true) {

        return parseFloat(this.sexagesimal2decimal(value));

      }

      throw new Error('Unknown format.');

    },

    /**
    * Converts a decimal coordinate value to sexagesimal format
    *
    * @param    float   decimal
    * @return   string    Sexagesimal value (XX° YY' ZZ")
    */
    decimal2sexagesimal: function(dec) {

      if (dec in this.sexagesimal) {
        return this.sexagesimal[dec];
      }

      var tmp = dec.toString().split('.');

      var deg = Math.abs(tmp[0]);
      var min = ('0.' + tmp[1])*60;
      var sec = min.toString().split('.');

      min = Math.floor(min);
      sec = (('0.' + sec[1]) * 60).toFixed(2);

      this.sexagesimal[dec] = (deg + '° ' + min + "' " + sec + '"');

      return this.sexagesimal[dec];

    },


    /**
    * Converts a sexagesimal coordinate to decimal format
    *
    * @param    float   Sexagesimal coordinate
    * @return   string    Decimal value (XX.XXXXXXXX)
    */
    sexagesimal2decimal: function(sexagesimal) {

      if (sexagesimal in this.decimal) {
        return this.decimal[sexagesimal];
      }

      var regEx = new RegExp(this.sexagesimalPattern);
      var data = regEx.exec(sexagesimal);
      var min = 0, sec = 0;

      if(data) {
        min = parseFloat(data[2]/60);
        sec = parseFloat(data[4]/3600) || 0;
      }

      var dec = ((parseFloat(data[1]) + min + sec)).toFixed(8);
      //var dec = ((parseFloat(data[1]) + min + sec));

        // South and West are negative decimals
        dec = (data[7] == 'S' || data[7] == 'W') ? parseFloat(-dec) : parseFloat(dec);
        //dec = (data[7] == 'S' || data[7] == 'W') ? -dec : dec;

      this.decimal[sexagesimal] = dec;

      return dec;

    },


    /**
    * Checks if a value is in decimal format
    *
    * @param    string    Value to be checked
    * @return   bool    True if in sexagesimal format
    */
    isDecimal: function(value) {

      value = value.toString().replace(/\s*/, '');

      // looks silly but works as expected
      // checks if value is in decimal format
      return (!isNaN(parseFloat(value)) && parseFloat(value) == value);

    },


    /**
    * Checks if a value is in sexagesimal format
    *
    * @param    string    Value to be checked
    * @return   bool    True if in sexagesimal format
    */
    isSexagesimal: function(value) {

      value = value.toString().replace(/\s*/, '');

      return this.sexagesimalPattern.test(value);

    },

    round: function(value, n) {
      var decPlace = Math.pow(10, n);
      return Math.round(value * decPlace)/decPlace;
    }

  });

  // Node module
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

    global.geolib = module.exports = geolib;

  // AMD module
  } else if (typeof define === "function" && define.amd) {

    define("geolib", [], function () {
      return geolib; 
    });

  // we're in a browser
  } else {

    global.geolib = geolib;

  }

}(this));
