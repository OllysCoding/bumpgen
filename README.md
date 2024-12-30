# Bumpgen: Automatically generate bumper content for your IPTV service

Bumper content are clips which can be used inbetween the main content of your TV channel which show information like the next show/movie playing. Bumpgen automates the creation of this, by reading from your IPTV xmltv file & generating bumper content based on your settings.

A file is output for each channel on your service, and which is replaced each time a new show starts (with an updated bumper based on what will be playing next). This content can then be imported in your chosen IPTV service.

## Getting Started

You can run bumpgen through docker compose, create a docker compose file from the [the template](./docs/compose.yml).

You'll need to update the `/path/to/your/output` and `/path/to/your/background-content` to the correct values for your setup. If desired, also change the config directory as needed.

If you haven't already, create the config directory, then create a file called `bumpgen.config.json` within it, and copy across the contents of [bumpgen.config.example.json](./configs/bumpgen.config.example.json). Then add the URL for your XML TV file, and change any other settings as desired.

You should now be good to go, run `docker compose up -d` to get started!
