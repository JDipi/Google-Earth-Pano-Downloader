// ==UserScript==
// @name         Google Maps Pano Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.google.com/local/imagery/report/*
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @require      https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js
// @resource     PANOVIEW https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css
// @require      file:///C:/Users/turtl/OneDrive/Desktop/Google-Maps-Pano-Downloader/PanoDownloader.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=example.com
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

// https://creativecoding.soe.ucsc.edu/courses/cs526/papers/Cavallo_3DCityReconstruction2015.pdf
// https://earth.google.com/web/@33.66067346,-117.66092875,243.89608209a,0d,60y,183.31218558h,71.35119943t,0r/data=IhoKFlA4Z2pWb1liNHYxQk5sMjZ2dHBRakEQAg
// https://www.google.com/local/imagery/report/?cb_client=earth.iv&cbp=1,0,,0,0&gl=US&hl=en&image_key=%211e2%212s7q_90B0sQurvz9YWoQtClQ
// tiles: w7 h4 (x 0-6, y 0-3)

(function () {
  const getStreetViewPano = (key) => {
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 32; j++) {
        $.ajax({
          type: "GET",
          url: `https://streetviewpixels-pa.googleapis.com/v1/tile?panoid=${key}&x=${j}&y=${i}&zoom=5`,
          beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          },
          success: function (result, textStatus, jqXHR) {
            if (result.length < 1) {
              alert("The thumbnail doesn't exist");
              $("#thumbnail").attr("src", "data:image/png;base64,");
              return;
            }

            var binary = "";
            var responseText = jqXHR.responseText;
            var responseTextLen = responseText.length;

            for (let k = 0; k < responseTextLen; k++) {
              binary += String.fromCharCode(responseText.charCodeAt(k) & 255);
            }

            $(`<img id="panoTile" src="data:image/png;base64,${btoa(binary)}" x="${i}" y="${j}" style="grid-area: ${i + 1} / ${j + 1} / span 1 / span 1; width: 200px;" />`).appendTo("#image_div");
          },
          error: function (xhr, textStatus, errorThrown) {
            console.log("whoops");
          },
        });
      }
    }
  };

  const getPhotoSpherePano = (key) => {
    // CHECK IF THIS WIDTH IS UNIVERSAL, current max???
    let url = $("#preview-image").attr("src").replace(/=w.*/gm, "=w16383");
    $.ajax({
      type: "GET",
      url,
      beforeSend: function (xhr) {
        xhr.overrideMimeType("text/plain; charset=x-user-defined");
      },
      success: function (result, textStatus, jqXHR) {
        if (result.length < 1) {
          alert("The thumbnail doesn't exist");
          $("#thumbnail").attr("src", "data:image/png;base64,");
          return;
        }

        var binary = "";
        var responseText = jqXHR.responseText;
        var responseTextLen = responseText.length;

        for (let k = 0; k < responseTextLen; k++) {
          binary += String.fromCharCode(responseText.charCodeAt(k) & 255);
        }

        $(/*html*/ `<img id="panoTile" src="data:image/png;base64,${btoa(binary)}" style="grid-area: 1 / 1 / span 1 / span 1;" />`).appendTo("#image_div");
        $("#imgModal").show();
        fetch(`data:image/png;base64,${btoa(binary)}`)
          .then((res) => res.blob())
          .then((blob) => {
            pannellum.viewer("panorama", {
              type: "equirectangular",
              panorama: URL.createObjectURL(blob),
              autoRotateInactivityDelay: 3000,
              autoRotate: 15,
            });
          });
      },
      error: function (xhr, textStatus, errorThrown) {
        console.log(`error: ${errorThrown}`);
      },
    });
  };

  GM_addStyle(/*css*/ `
    #image_div {
      display: grid;
      position: relative;
      width: 100%;
      height: 50%;
      background: white;
    }

    #image_div > img {
      position: absolute;
      height: 100%;
      transform: translate(-50%, 0px);
      left: 50%;
    }

    #download {
      padding: 5px;
      color: white;
    }

    #panorama {
      width: 100%;
      height: 50%;
    }

    #imgModal {
      position: fixed;
      display: flex;
      flex-direction: column;
      top: 50px;
      left: 40px;
      bottom: 50px;
      right: 40px;
      z-index: 1000002;
      background: gray;
      justify-content: center;
      align-items: center;
    }

  `);

  $(`<button id="download">Download Pano</button>`).prependTo("c-wiz");

  $(/*html*/ `
    <div id="imgModal">
      <div id="image_div"></div>
      <div id="panorama"></div>
    </div>
  `).insertAfter(".O3cKLb");
  $("#imgModal").hide();

  GM_addStyle(GM_getResourceText("PANOVIEW"));

  $("#download").on("click", () => {
    let key = window.location.href.match(/%212s(.*)/)[1];
    if ($("#streetview-preview").length) {
      getStreetViewPano(key);
    } else {
      getPhotoSpherePano(key);
    }
    console.log(key);
  });
})();
