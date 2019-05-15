const express = require('express');
const google = require('googleapis').google;
const youtube = google.youtube({version: 'v3'});
const OAuth2 = google.auth.OAuth2;
const state = require('./state.js');
const fs = require('fs');

async function robot() {
    console.log('> [youtube-robot] Starting...');
    const content = state.load();

    const videoFilePath = 'video.mp4';
    const videoFileSize = fs.statSync(videoFilePath).size;

    let videoTitle = await returnVideoTitle(content);
    console.log(`> [youtube-robot] Video title set`);

    let videoDescription = await returnVideoDescription(content);
    console.log(`> [youtube-robot] Video description set`);

    let videoTags = [content.searchTerm, ...content.sentences[0].keywords, ...content.sentences[1].keywords, ...content.sentences[2].keywords];
    console.log(`> [youtube-robot] Video tags set`);

    async function returnVideoTitle(content) {
        if(content.prefix === ':ABOUT:'){
            return `${content.prefix} ${content.searchTerm} [${content.language}]`
        }else{
            return `${content.prefix} ${content.searchTerm}`
        }
    }

    async function returnVideoDescription(content){
        let videoDescription = "";
        for(let index = 0; index < content.maximumSentences; index++) {
            videoDescription = videoDescription + content.sentences[index].text + "\n\n";
        }
        videoDescription = `${videoDescription} #${content.searchTerm}`;
        return videoDescription;
    }

    if (content.videoDestination == "YouTube") {

        await authenticateWithOAuth();
        const videoInformation = await uploadVideo(content);
        await uploadThumbnail(videoInformation);

        async function authenticateWithOAuth() {
            const webServer = await startWebServer();
            const OAuthClient = await createOAuthClient();
            requestUserConsent(OAuthClient);
            const authorizationToken = await waitForGoogleCallback(webServer);
            await requestGoogleForAccessTokens(OAuthClient, authorizationToken);
            await setGlobalGoogleAuthentication(OAuthClient);
            await stopWebServer(webServer);

            async function startWebServer() {
                return new Promise((resolve, reject) => {
                    const port = 5000;
                    const app = express();

                    const server = app.listen(port, () => {
                        console.log(`> [youtube-robot] Listening on http://localhost:${port}`);

                        resolve({
                            app,
                            server
                        })
                    })
                })
            }

            async function createOAuthClient() {
                const credentials = require('../credentials/google-youtube.json');

                const OAuthClient = new OAuth2(
                    credentials.web.client_id,
                    credentials.web.client_secret,
                    credentials.web.redirect_uris[0]
                );

                return OAuthClient
            }

            function requestUserConsent(OAuthClient) {
                const consentUrl = OAuthClient.generateAuthUrl({
                    access_type: 'offline',
                    scope: ['https://www.googleapis.com/auth/youtube']
                });

                console.log(`> [youtube-robot] Please give your consent: ${consentUrl}`)
            }

            async function waitForGoogleCallback(webServer) {
                return new Promise((resolve, reject) => {
                    console.log('> [youtube-robot] Waiting for user consent...');

                    webServer.app.get('/oauth2callback', (req, res) => {
                        const authCode = req.query.code;
                        console.log(`> [youtube-robot] Consent given: ${authCode}`);

                        res.send('<h1>Thank you!</h1><p>Now close this tab.</p>');
                        resolve(authCode)
                    })
                })
            }

            async function requestGoogleForAccessTokens(OAuthClient, authorizationToken) {
                return new Promise((resolve, reject) => {
                    OAuthClient.getToken(authorizationToken, (error, tokens) => {
                        if (error) {
                            return reject(error)
                        }

                        console.log('> [youtube-robot] Access tokens received!');

                        OAuthClient.setCredentials(tokens);
                        resolve()
                    })
                })
            }

            function setGlobalGoogleAuthentication(OAuthClient) {
                google.options({
                    auth: OAuthClient
                })
            }

            async function stopWebServer(webServer) {
                return new Promise((resolve, reject) => {
                    webServer.server.close(() => {
                        resolve()
                    })
                })
            }
        }

        async function uploadVideo(content) {
            try {
                const requestParameters = {
                    part: 'snippet, status',
                    requestBody: {
                        snippet: {
                            title: videoTitle,
                            description: videoDescription,
                            tags: videoTags
                        },
                        status: {
                            privacyStatus: 'public'
                        }
                    },
                    media: {
                        body: fs.createReadStream(videoFilePath)
                    }
                };

                console.log('> [youtube-robot] Starting to upload the video to YouTube');
                const youtubeResponse = await youtube.videos.insert(requestParameters, {
                    onUploadProgress: onUploadProgress
                });

                console.log(`> [youtube-robot] Video available at: https://youtu.be/${youtubeResponse.data.id}`);
                console.log(`\n> [youtube-robot] Video Title: ${videoTitle}`);
                console.log(`\n> [youtube-robot] Video Description: ${videoDescription}`);
                console.log(`\n> [youtube-robot] Video Tags: ${videoTags}`);
                return youtubeResponse.data;

                function onUploadProgress(event) {
                    const progress = Math.round((event.bytesRead / videoFileSize) * 100);
                    console.log(`> [youtube-robot] ${progress}% completed - ${(event.bytesRead/1000000).toFixed(2)}MB of ${(videoFileSize/1000000).toFixed(2)}MB`)
                }

            } catch (e) {
                console.error('> [youtube-robot] YouTube upload ERROR ' + e);
                console.log('> [youtube-robot] You Need to upload video manually');
                console.log(`\n> [youtube-robot] Video Title: ${videoTitle}`);
                console.log(`\n> [youtube-robot] Video Description: ${videoDescription}`);
                console.log(`\n> [youtube-robot] Video Tags: ${videoTags}`)

            }
        }

        async function uploadThumbnail(videoInformation) {
            try {
                console.log(`> [youtube-robot] VideoId ${videoInformation.id}`)
                const videoId = videoInformation.id;
                const videoThumbnailFilePath = './content/youtube-thumbnail.jpg';

                const requestParameters = {
                    videoId: videoId,
                    media: {
                        mimeType: 'image/jpeg',
                        body: fs.createReadStream(videoThumbnailFilePath)
                    }
                };

                const youtubeResponse = await youtube.thumbnails.set(requestParameters);
                console.log(`> [youtube-robot] Thumbnail uploaded!`)
            } catch (e) {
                console.log(`> [youtube-robot] Thumbnail não enviada ` + e)
            }
        }

    } else {
        console.error('> [youtube-robot] Video processing ended');
        console.log('> [youtube-robot] You Need to upload video manually');
        console.log(`\n> [youtube-robot] Video Title: ${videoTitle}`);
        console.log(`\n> [youtube-robot] Video Description: ${videoDescription}`);
        console.log(`\n> [youtube-robot] Video Tags: ${videoTags}`)
    }
}

module.exports = robot;
