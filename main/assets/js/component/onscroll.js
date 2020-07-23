$(function() {
    var header = $("header");
  
    $(window).scroll(function() {    
        var scroll = $(window).scrollTop();
        if (scroll >= 50) {
            header.addClass("scrolled");
        } else {
            header.removeClass("scrolled");
        }
    });
  
});

$(function() {
    var header = $(".nav-title");

    $(window).scroll(function() {    
        var scroll = $(window).scrollTop();
        if (scroll >= 50) {
            header.addClass("black-text");
        } else {
            header.removeClass("black-text");
        }
    });
  
});

$(document).ready(function() {
    var initialSrc = "assets/img/logowhite.png";
    var scrollSrc = "assets/img/logoblack.png";

    $(window).scroll(function() {
    var value = $(this).scrollTop();
    if (value > 50)
        $(".logo").attr("src", scrollSrc);
    else
        $(".logo").attr("src", initialSrc);
    });
});
