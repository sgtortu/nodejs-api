
module.exports = generatePassword = () => {
    /**
  * sets of charachters
  */
  var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  var lower = "abcdefghijklmnopqrstuvwxyz"
  var digit = "0123456789"
  //var all = upper + lower + digit
  var all =  digit

  /**
  * generate random integer not greater than `max`
  */

  function rand (max) {
  return Math.floor(Math.random() * max)
  }

  /**
  * generate random character of the given `set`
  */

  function random (set) {
  return set[rand(set.length - 1)]
  }

  /**
  * generate an array with the given `length`
  * of characters of the given `set`
  */

  function generate (length, set) {
  var result = []
  while (length--) result.push(random(set))
  return result
  }

  /**
  * shuffle an array randomly
  */
  function shuffle (arr) {
  var result = []

  while (arr.length) {
  result = result.concat(arr.splice(rand[arr.length - 1]))
  }

  return result
  }
  /**
  * do the job
  */
  function password (length) {
  var result = [] // we need to ensure we have some characters

  result = result.concat(generate(1, upper)) // 1 upper case
  result = result.concat(generate(1, lower)) // 1 lower case
  result = result.concat(generate(1, digit)) // 1 digit
  result = result.concat(generate(length - 3, all)) // remaining - whatever

  return shuffle(result).join("") // shuffle and make a string
  }

  return(password(6))
}
 