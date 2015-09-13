// This file is executed in the browser, when people visit /chat/<random id>

$(function () {

    if (!cchat.enc) {
        throw 'Please load encryption module first';
    }

    var encryptionAlgorithm, encryptionKey, checksumAlgorithm, checksumKey;
    var encryptionKeyConfigValue, checksumKeyConfigValue, rsaPublicKey, rsaPrivateKey;
    var matePublicRSAKey;

    var isChatInitiator;

    cchat.config.onload(function () {
        encryptionAlgorithm = cchat.config.get.encryption.alg();
        encryptionKeyConfigValue = cchat.config.get.encryption.key();
        checksumAlgorithm = cchat.config.get.checksum.alg();
        checksumKeyConfigValue = cchat.config.get.checksum.key();

        rsaPrivateKey = cchat.enc.generateRSAPrivateKey(1028);
        rsaPublicKey = cchat.enc.generateRSAKey(rsaPrivateKey);

        encryptionKey = getKey(encryptionKeyConfigValue);
        console.log("encryptionKey", encryptionKey);
        checksumKey = getKey(checksumKeyConfigValue);
    });


    var myKey = genKey(26);
    console.log("my generated key: " + myKey);
    var myKey = "thisismykey";
    // getting the id of the room from the url
    var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

    // connect to the socket
    var socket = io();

    // variables which hold the data for each person
    var name = "",
        email = "",
        img = "",
        friend = "";

    // cache some jQuery objects
    var section = $(".section"),
        footer = $("footer"),
        onConnect = $(".connected"),
        inviteSomebody = $(".invite-textfield"),
        personInside = $(".personinside"),
        chatScreen = $(".chatscreen"),
        left = $(".left"),
        noMessages = $(".nomessages"),
        tooManyPeople = $(".toomanypeople");

    // some more jquery objects
    var chatNickname = $(".nickname-chat"),
        leftNickname = $(".nickname-left"),
        loginForm = $(".loginForm"),
        yourName = $("#yourName"),
        yourEmail = $("#yourEmail"),
        hisName = $("#hisName"),
        hisEmail = $("#hisEmail"),
        chatForm = $("#chatform"),
        textarea = $("#message"),
        messageTimeSent = $(".timesent"),
        chats = $(".chats");

    // these variables hold images
    var ownerImage = $("#ownerImage"),
        leftImage = $("#leftImage"),
        noMessagesImage = $("#noMessagesImage");


    function shouldUseRSAForKeySwap(keyConfigValue) {
        return keyConfigValue === '*';
    }

    function getKey(keyConfigValue) {
        if (shouldUseRSAForKeySwap(keyConfigValue)) {
            return cchat.enc.genKey(128);
        }

        return keyConfigValue;
    }

    socket.on('onRSASwap', function (data) {
        matePublicRSAKey = data.rsaPublicKey;
        if (isChatInitiator) {
            socket.emit('onKeySwap', {
                encryptionKey: cchat.enc.rsaEncrypt(encryptionKey, matePublicRSAKey),
                checksumKey: cchat.enc.rsaEncrypt(checksumKey, matePublicRSAKey)
            });
        }
    });

    socket.on('onKeySwap', function (data) {
        console.log('on key swap data: ', data);
        encryptionKey = cchat.enc.rsaDecrypt(data.encryptionKey.cipher, rsaPrivateKey).plaintext;
        checksumKey = cchat.enc.rsaDecrypt(data.checksumKey.cipher, rsaPrivateKey).plaintext;
    });

    // on connection to server get the id of person's room
    socket.on('connect', function () {

        socket.emit('load', id);
    });

    // save the gravatar url
    socket.on('img', function (data) {
        img = data;
    });

    // receive the names and avatars of all people in the chat room
    socket.on('peopleinchat', function (data) {

        if (data.number === 0) {

            showMessage("connected");

            loginForm.on('submit', function (e) {

                e.preventDefault();

                name = $.trim(yourName.val());

                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }

                email = yourEmail.val();

                if (!isValid(email)) {
                    alert("Please enter a valid email!");
                }
                else {

                    showMessage("inviteSomebody");

                    // call the server-side function 'login' and send user's parameters
                    socket.emit('login', {user: name, avatar: email, id: id});
                }

            });
        }

        else if (data.number === 1) {

            showMessage("personinchat", data);

            loginForm.on('submit', function (e) {

                e.preventDefault();

                name = $.trim(hisName.val());

                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }

                if (name == data.user) {
                    alert("There already is a \"" + name + "\" in this room!");
                    return;
                }
                email = hisEmail.val();

                if (!isValid(email)) {
                    alert("Wrong e-mail format!");
                }
                else {
                    socket.emit('login', {user: name, avatar: email, id: id});
                }

            });
        }

        else {
            showMessage("tooManyPeople");
        }

    });

    // Other useful
    socket.on('startChat', function (data) {
        console.log(data);
        if (data.boolean && data.id == id) {

            chats.empty();
            isChatInitiator = name === data.users[0];
            if (isChatInitiator) {
                showMessage("youStartedChatWithNoMessages", data);
            }
            else {
                showMessage("heStartedChatWithNoMessages", data);
                socket.emit('onRSASwap', {rsaPublicKey: rsaPublicKey})
            }

            chatNickname.text(friend);
        }
    });

    socket.on('leave', function (data) {

        if (data.boolean && id == data.room) {

            showMessage("somebodyLeft", data);
            chats.empty();
        }

    });

    socket.on('tooMany', function (data) {

        if (data.boolean && name.length === 0) {

            showMessage('tooManyPeople');
        }
    });


    //DATA RECIEVED FROM SERVER !!! (DECRYPT)
    socket.on('receive', function (data) {
        // console.log("encrypted msg with rc4: " + data.msg);
        //run rc4 to decrypt the recived msg
        data.msg = cchat.enc[encryptionAlgorithm](encryptionKey, data.msg);
        //calculate hmac md5 to verify the msg is authentic
        if (checksumAlgorithm) {
            var checksum = cchat.enc[checksumAlgorithm](checksumKey, data.msg);
            console.log(checksum);
            //the checksum recived
            console.log("check: " + data.check);
            //compare
            if (checksum != data.check) {
                alert("Warning: This msg might not be authentic!!");
            }
        }

        showMessage('chatStarted');

        if (data.msg.trim().length) {
            createChatMessage(data.msg, data.user, data.img, moment());
            scrollToBottom();
        }
    });

    textarea.keypress(function (e) {

        // Submit the form on enter
        if (e.which == 13) {
            e.preventDefault();
            chatForm.trigger('submit');
        }

    });

    chatForm.on('submit', function (e) {

        e.preventDefault();

        // Create a new chat message and display it directly
        showMessage("chatStarted");

        if (textarea.val().trim().length) {
            createChatMessage(textarea.val(), name, img, moment());
            scrollToBottom();


            //SEND MSG (ENCRYPT)
            // Send the message to the other person in the chat
            var check = cchat.enc[checksumAlgorithm](checksumKey, textarea.val());
            console.log(check);
            socket.emit('msg', {
                check: check,
                msg: cchat.enc[encryptionAlgorithm](encryptionKey, textarea.val()),
                user: name,
                img: img
            });
        }
        textarea.val(""); // Empty the textarea
    });

    // Update the relative time stamps on the chat messages every minute
    setInterval(function () {

        messageTimeSent.each(function () {
            var each = moment($(this).data('time'));
            $(this).text(each.fromNow());
        });

    }, 60000);


    // Function that creates a new chat message
    function createChatMessage(msg, user, imgg, now) {


        var who = '';

        if (user === name) {
            who = 'me';
        }
        else {
            who = 'you';
        }

        var li = $(
            '<li class=' + who + '>' +
            '<div class="image">' +
            '<img src=' + imgg + ' />' +
            '<b></b>' +
            '<i class="timesent" data-time=' + now + '></i> ' +
            '</div>' +
            '<p></p>' +
            '</li>');

        // use the 'text' method to escape malicious user input
        li.find('p').text(msg);
        li.find('b').text(user);

        chats.append(li);

        messageTimeSent = $(".timesent");
        messageTimeSent.last().text(now.fromNow());

    }

    function scrollToBottom() {
        $("html, body").animate({scrollTop: $(document).height() - $(window).height()}, 1000);
    }

    function isValid(thatemail) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(thatemail);
    }

    function showMessage(status, data) {

        if (status === "connected") {

            section.children().css('display', 'none');
            onConnect.fadeIn(1200);
        }

        else if (status === "inviteSomebody") {

            // Set the invite link content
            $("#link").text(window.location.href);

            onConnect.fadeOut(1200, function () {
                inviteSomebody.fadeIn(1200);
            });
        }

        else if (status === "personinchat") {

            onConnect.css("display", "none");
            personInside.fadeIn(1200);

            chatNickname.text(data.user);
            ownerImage.attr("src", data.avatar);
        }

        else if (status === "youStartedChatWithNoMessages") {

            left.fadeOut(1200, function () {
                inviteSomebody.fadeOut(1200, function () {
                    noMessages.fadeIn(1200);
                    footer.fadeIn(1200);
                });
            });

            friend = data.users[1];
            noMessagesImage.attr("src", data.avatars[1]);
        }

        else if (status === "heStartedChatWithNoMessages") {

            personInside.fadeOut(1200, function () {
                noMessages.fadeIn(1200);
                footer.fadeIn(1200);
            });

            friend = data.users[0];
            noMessagesImage.attr("src", data.avatars[0]);
        }

        else if (status === "chatStarted") {

            section.children().css('display', 'none');
            chatScreen.css('display', 'block');
        }

        else if (status === "somebodyLeft") {

            leftImage.attr("src", data.avatar);
            leftNickname.text(data.user);

            section.children().css('display', 'none');
            footer.css('display', 'none');
            left.fadeIn(1200);
        }

        else if (status === "tooManyPeople") {

            section.children().css('display', 'none');
            tooManyPeople.fadeIn(1200);
        }
    }

});
