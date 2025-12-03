import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Skype | Basekamp",
};

export default function Page() {
  return (
    <div>
      <h1>Welcome Skype potluck guests!</h1>
      <p>
        In hopes of making the Skype Potlucks more fun and making you more
        comfortable, we've described the general structure below.
      </p>
      <h2>About the potlucks</h2>
      <p>
        Potlucks are informal talks based on mutual respect between all
        participants. They generally follow a loose interview style with
        Basekamp hosts getting the ball rolling and the floor open to questions
        from everyone on the call from the start. The call uses audio chat on
        Skype. Invited guests: If a different format would work better for you,
        please feel free to discuss it before the chat so we can prepare.
      </p>
      <h2>Start &amp; end time</h2>
      <p>
        While potlucks officially begin at the specified time (example:
        Plausible Artworlds chats started at 6 PM ET), we rarely start exactly
        on time… generally it takes a few minutes to get set up, wrangle dozens
        of people from around the world etc. But no matter how late we start, we
        always - without exception - end precisely on time!
      </p>
      <h2>Voice chat</h2>
      <p>
        Potlucks will take advantage of Skype voice chat and will generally be
        (loosely) transcribed into Skype text chat for those who cannot do voice
        chat. Download from skype.com if you don't already have it.
      </p>
      <h2>Contact us by text</h2>
      <p>
        In Skype “Add a contact”: basekamp. Send a message when you want to join
        the chat, by selecting us from your list and clicking 'Start chat'.
        We'll add you to the text chat, and when everyone is ready we'll start
        the conference call.
      </p>
      <h2>Starting the call</h2>
      <p>
        Basekamp will take care of initiating and maintaining the voice chat.
        Please DO NOT initiate a voice chat otherwise as it will confuse
        everyone. Basekamp will add you to the voice chat when we begin.
      </p>
      <h2>Mute your microphone</h2>
      <p>
        For everyone on the voice chat except the invited guest: PLEASE mute
        your microphone (there is a microphone icon that you must click which
        will become a crossed out microphone) unless you are making a comment or
        asking a question. If you do not, the combination of background noise
        and feedback can ruin the call for everyone.
      </p>
      <h2>Request voice chat</h2>
      <p>
        Basekamp will add all those interested in voice chat at the beginning of
        the call. If we miss you or if you get online after the voice chat has
        started, please type [ADD AUDIO] into the text chat. We will add you as
        soon as we have an opportunity.
      </p>
      <h2>Asking a question from text</h2>
      <p>
        If you are not part of the voice chat but wish to ask a question of the
        invited guest, please preface it with [QUESTION] so that we are able to
        notice your question and, hopefully, ask the guest when an opening
        occurs.
      </p>
      <h2>Who are you?</h2>
      <p>
        This applies to everyone on the voice chat, including the invited guest:
        please identify yourself if the person speaking is switched. If you are
        asking a question, please start by saying “This is [Your Name]” or some
        other identifier. If the invited guest responding to the question is not
        the same person previously speaking, please do the same. This will make
        it easier to transcribe for the text chat and it will make the voice
        chat a better audio recording for those who cannot be present.
      </p>
      <h2>Invited guest consideration: video</h2>
      <p>
        If the invited guest would like to have live video, it is not possible
        to have a Skype video chat with multiple parties. Instead, we can work
        with you to set up a ustream account (
        <Link href="http://www.ustream.tv" title="http://www.ustream.tv">
          http://www.ustream.tv
        </Link>
        ) that will allow you to broadcast live video from a webcam.
      </p>
    </div>
  );
}
