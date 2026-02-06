# OrbisArcana
OribisArcanis Game development.

game-receiver is the main game page. From this page the user generates a QR code that automatically launches and connects the mobie-receiver through Ably. Keys are secret through Cloudflare.

Currently the only way to test this app is through the newtwork with Ably relaying the messages. In the future we'll create a local build and down the road we'll create our own server to dispatch messages for multiple instances of the game.
