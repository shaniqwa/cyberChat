//generate hex string
function genKey(length) {
  var ret = "";
  while (ret.length < length) {
    ret += Math.random().toString(16).substring(2);
  }
// }

// rc4_gen(){
// 	n = genKey(26);
// 	set("rc4.key", toString(n));
     
  return ret.substring(0,length);
}

// on.click(button, gen_key){
// 	s= get("encryption_alg");                                                              
// 	eval(s+"_gen()");