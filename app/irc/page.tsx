import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "IRC | Basekamp",
};

export default function Page() {
  return (
    <div>
      <h1>IRC</h1>
      <p>
        Hi there - feel free to join us on IRC using the chat-box below. To get
        started:
      </p>
      <ol>
        <li>Choose a "Nickname"</li>
        <li>Click "Connect"</li>
        <li>
          Type what you want to say in the white box (at the bottom of the blue
          chat box below)
        </li>
      </ol>
      <p>
        Optionally, you might want to try some{" "}
        <a href="#help">useful IRC commands</a> below (but you don't need to do
        anything else to get started).
      </p>
      <p>
        If you don't see us on IRC, feel free to contact us{" "}
        <a href="/contact">here</a>.
      </p>
      <object
        id="irc"
        type="text/html"
        data="https://irc.com/?channels=basekamp"
        className="w-full h-150 pt-2 pb-6"
      >
        <p>Oops! That didn't work…</p>
      </object>
      <p id="help">
        <strong>New to IRC? Here are some useful commands:</strong>
      </p>
      <ul>
        <li>
          <code>/help</code> Display help.
        </li>
        <li>
          <code>/clear</code> Clear the chat output in this channel.
        </li>
        <li>
          <code>/nick [nick]</code> Change your nickname.
        </li>
        <li>
          <code>/msg [nick] [message]</code> Send a private message.
        </li>
        <li>
          <code>/join [channel name]</code> Join another channel.
        </li>
        <li>
          <code>/whois [nick]</code> Find out all manner of things about
          someone.
        </li>
        <li>
          <code>/me [text]</code> Emote (example: “/me loves this old-school
          chat-box”).
        </li>
        <li>
          <code>/away [message]</code> Set your status to away.
        </li>
        <li>
          <code>/back</code> Set your status to back.
        </li>
      </ul>
    </div>
  );
}
