# Bumpgen: Automatically generate bumper content for your IPTV service

Bumper content are clips which can be used inbetween the main content of your TV channel which show information like the next show/movie playing. Bumpgen automates the creation of this, by reading from your IPTV xmltv file & generating bumper content based on your settings.

A file is output for each channel on your service, and which is replaced each time a new show starts (with an updated bumper based on what will be playing next). This content can then be imported in your chosen IPTV service.

---

<h2 align=center>🛠️ Project under active development 🛠️</h2>
<p align=center>There is no official release yet (though dev releases are available on <code>ollyscoding/bumpgen-test:&lt;commit-sha&gt;</code>), and breaking changes will be actively made until v0.1 is released</p>

---

## Getting Started

You can run bumpgen through docker compose, create a docker compose file from the [the template](./docs/compose.yml).

You'll need to update the `/path/to/your/output` and `/path/to/your/background-content` to the correct values for your setup. If desired, also change the config directory as needed.

If you haven't already, create the config directory, then create a file called `bumpgen.config.json` within it, and copy across the contents of [bumpgen.config.example.json](./configs/bumpgen.config.example.json). Then add the URL for your XML TV file, and change any other settings as desired.

You should now be good to go, run `docker compose up -d` to get started!

### Templates

Bumpgen offers a number of default templates to use for your channels, as well as exerimental plugin support if you want to develop your own templates.

<table>
  <tr>
    <th>Name</th>
    <th>Example</th>
  </tr>
  <tr>
    <td><code>centre-title-and-time</code></td>
    <td><img src="./docs/screenshots/template_centre-title-and-time.png"  width=500px></td>
   </tr> 
   <tr>
      <td><code>left-panel-info</code></td>
      <td><img src="./docs/screenshots/template_left-panel-info.png"  width=500px></td>
  </td>
   <tr>
      <td><code>left-panel-next-five</code></td>
      <td><img src="./docs/screenshots/template_left-panel-next-five.png"  width=500px></td>
  </td>
  </tr>
</table>

## What's still needed for MVP?

- Give templates all upcoming shows not just the next one & build 'left-panel-next-5' template
- Options for resolution (per channel)
- Option for length including \* as 'fill'
- Plugins: some kind of versioning + publish types + example repo + language/locale in template
- Frontend for configuring
- Allow animations?
