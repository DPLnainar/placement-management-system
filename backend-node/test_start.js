try {
    console.log("Attempting to require server_copy.js");
    require('./server_copy.js');
    console.log("Success!");
} catch (e) {
    console.error("Error requiring dist/server.js:", e);
}
