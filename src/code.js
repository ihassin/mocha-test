pm.globals.set('loadUtils', function loadUtils() {
	let utils = {};
	utils.errorMessage = '';

	utils.testGenericResponse = function testGenericResponse(testResponse, ravenListing) {
		pm.test("GenericTest: Status code is 200", function () {
			testResponse.to.have.status(200);
		});

		pm.test("GenericTest: Response contains no errors", function () {
			pm.expect(ravenListing.errors).to.be.equals(null)
		});
	}

	utils.testListingPresent = function testListingPresent(testResponse) {
		pm.test("testListingPresent: Returns a listing", function () {
			pm.expect(testResponse.text()).to.include("listing")
		});

	}

	utils.sortByMultipleId = function sortBySingleId(array) {
		return array.sort(function(a,b){
			var x = a.id; var y = b.id;
			return (x < y) ? -1 : ((x > y ? 1 : 0));
		});
	}

	utils.sortByMultipleTime = function sortBySingleTime(array) {
		return array.sort(function(a,b){
			var x = a.startAt; var y = b.startAt;
			return (x < y) ? -1 : ((x > y ? 1 : 0));
		});
	}

	// raven and postgres (and the associated drivers) treat decimal numbers with a "0" decimal value
	// differently. The actual data migration is being validate elsewhere, so we just ignore
	// the actual values here
	utils.ignoreDecimalFieldsInListing = function ignoreDecimalFieldsInListing(ravenListing, postgresListing) {
		ravenListing.listing.directPurchasePrice = postgresListing.listing.directPurchasePrice = "ignoreMe";
		ravenListing.listing.approximateCurrentPrice = postgresListing.listing.approximateCurrentPrice = "ignoreMe";
		utils.ignoreConfiguredField('Cylinders', ravenListing, postgresListing);
		utils.ignoreConfiguredField('CurrentOdometer', ravenListing, postgresListing);
		utils.ignoreConfiguredField('Mileage', ravenListing, postgresListing);
		utils.ignoreConfiguredField('ModelYear', ravenListing, postgresListing);
		utils.ignoreConfiguredField('Prices-MSRP', ravenListing, postgresListing);
		utils.ignoreConfiguredField('ApproximateBidCount', ravenListing, postgresListing);
		utils.ignoreConfiguredField('ApproximateCurrentPrice', ravenListing, postgresListing);
		// leveraging the same mechanism, even though this is a date instead of a decimal field
		utils.ignoreConfiguredField('EndAt', ravenListing, postgresListing);
	}

	utils.ignoreCurrentLocationFieldsInListing = function ignoreCurrentLocationFieldsInListing(ravenListing, postgresListing) {
		ravenListing.listing.currentLocation.summary = postgresListing.listing.currentLocation.summary = "ignoreMe";
		ravenListing.listing.currentLocation.orgId = postgresListing.listing.currentLocation.orgId = "ignoreMe";
		ravenListing.listing.currentLocation.orgKind = postgresListing.listing.currentLocation.orgKind = "ignoreMe";
	}

	utils.ignoreConfiguredField = function ignoreConfiguredField(fieldName, ravenListing, postgresListing) {
		ravenListing.listing.allConfiguredFields.find(field => field.id === fieldName).value = "ignoreMe";
		postgresListing.listing.allConfiguredFields.find(field => field.id === fieldName).value = "ignoreMe";
	}

	utils.compareListingsDeep = function compareListingsDeep(ravenListing, postgresListing) {
		pm.test("Raven response body should be the same as postgres response body", function() {
			pm.expect(ravenListing.listings).to.not.equal(undefined);
			pm.expect(postgresListing.listings).to.not.equal(undefined);
			pm.expect(ravenListing.listings).to.have.length(postgresListing.listings.length);

			pm.test("Listing response bodies should match", function() {
				for( let i = 0; i < pg_listing.listings.length; i++ ) {
					utils.compareSingleListingDeep(ravenListing.listings[i],postgresListing.listings[i]);
				}
			});

		});
	}

	utils.compareSingleListingDeep = function compareSingleListingDeep(ravenListing, postgresListing) {
		ravenListing.currentServerTime = postgresListing.currentServerTime = "ignoreMe";
		ravenListing.listingStatusLastChanged = postgresListing.listingStatusLastChanged = "ignoreMe";
		pm.expect(utils.isEqual("listing", ravenListing, postgresListing), JSON.stringify(utils.errorMessage)).to.equal(true);
	}

	utils.isEqual = function isEqual(parentName, ravenArray, postgresArray) {
		// console.log("checking " + parentName);
		// if (ravenArray != null && ravenArray != undefined) {
		//     console.log("ravenArray values " + Object.values(ravenArray));
		// }
		// if (postgresArray != null && postgresArray != undefined) {
		//     console.log("postgresArray values " + Object.values(postgresArray));
		// }

		// if (ravenArray === postgresArray) {
		//     console.log(parentName + " is the same on both sides");
		//     return true;
		// }

		if (ravenArray === null && postgresArray === null) {
			// console.log(parentName + " is null on both sides");
			return true;
		}

		if (ravenArray === undefined && postgresArray === undefined) {
			// console.log(parentName + " is undefined on both sides");
			return true;
		}

		if (Array.isArray(ravenArray) && ravenArray.length === 0 && Array.isArray(postgresArray) && postgresArray.length === 0) {
			return true;
		}

		if (ravenArray === null || ravenArray === undefined || (Array.isArray(ravenArray) && ravenArray.length === 0) || postgresArray === null || postgresArray === undefined || (Array.isArray(postgresArray) && postgresArray.length === 0)) {
			utils.errorMessage = parentName + " - one of the arrays is null, undefined or empty";
			// console.log(utils.errorMessage);
			return false;
		}

		if (ravenArray.length === 0 && postgresArray.length === 0) {
			// console.log(parentName + " is empty on both sides");
			return true;
		}

		// console.log("the objects are not null, undefined or empty, so proceeding with actual compare");

		if(Array.isArray(ravenArray) && Array.isArray(postgresArray) && (ravenArray.length == postgresArray.length)) {
			// console.log(parentName + " is an array");
			ravenArray.forEach((prop,index) => {
				if(!isEqual(parentName, ravenArray[index], postgresArray[index])) {
					utils.errorMessage = "Property: " + parentName + ": " + JSON.stringify(ravenArray[index]) + " is not equal to " +  JSON.stringify(postgresArray[index]);
					console.log(utils.errorMessage);
					return false;
				}
			})
		}

		// console.log("either the objects are not arrays, or they're identical arrays");

		let keys = Object.keys(ravenArray);
		if (keys.length !== Object.keys(postgresArray).length) {
			utils.errorMessage = "the " + parentName + " are not the same length";
			console.log(utils.errorMessage);
			console.log("ravenArray values = " + Object.values(ravenArray));
			console.log("postgresArray values = " + Object.values(postgresArray));
			return false;
		}

		if ((typeof ravenArray) === "object") {
			return keys.every(k => utils.isEqual(k, ravenArray[k], postgresArray[k]));
		} else {
			// console.log("comparing primitive types");
			return (ravenArray === postgresArray);
		}

	}
	return utils;
} + '; loadUtils();');


function isEqual(parentName, firstObject, secondObject) {
	if (firstObject === secondObject){
		return true;
	}

	if (firstObject === null || firstObject === undefined ||
		secondObject === null || secondObject === undefined) {
		errorMessage = "one of the arrays is null, undefined or empty";
		return false;
	}

	if(firstObject.length != secondObject.length) {
		errorMessage = "lengths are not the same";
		return false;
	}

	if(Array.isArray(firstObject) && Array.isArray(secondObject) && (firstObject.length == secondObject.length)) {
		firstObject.forEach((prop, index) => {
			if(!isEqual(parentName, firstObject[index], secondObject[index])) {
				errorMessage = "Property: " + JSON.stringify(prop) + ":" +  JSON.stringify(firstObject[index]) + " is not equal to " +  JSON.stringify(secondObject[index]);
				return false;
			}
		})
	}

	let keys = Object.keys(firstObject);
	if (keys.length !== Object.keys(secondObject).length) {
		errorMessage = "the " + parentName + " are not the same length";
		return false;
	}

	return keys.every(k => isEqual(k, firstObject[k], secondObject[k]));
}

module.exports.isEqual = isEqual;
