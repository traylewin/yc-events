Building an Event platform for YC

YC runs tons of events - over 100 / year.  For example:

* Co-founder matching meetups to find a potential cofounder 
* Hackathons at our office
* Our demo days where we invite investors to meet companies in the batch

You'd think we could use Eventbrite or something to run these events, but our events are specialized enough that we've built our own event software.  Your job in this interview will be to reproduce some of this event software.

There are a few reasons we had to build our own software.  The most important is that unlike most events, our events are by application only.  We typically have hundreds or even thousands of people apply to the event, and then YC employees read the applications and decide who to invite.  No existing event software is designed to streamline this high-volume application review.
What we have so far

You can find the artifacts you need to get started in this folder. In it, you will find:

Project prompt (This document). A high level direction of how we got here and where we want you to take it.
Event form.pdf. This is what the designer came up with; it’s better than most of the designs/specs we get for everyday projects.
Attendee_list.csv. An event registration list for a past event, exported from a Google Form.
Users.json. List of users & additional data in our existing system. It has some remnants of other previous features we’ve built, and should be sufficient to get started with the build. 

Lastly: there’s a lot to build, and there’s a lot of ambiguity in the process. The people who are sitting/meeting with you are helpful to get you up-to-speed, answer questions you may have, and guide you in the build. Treat them as you would a co-worker but always err on the side of asking more questions, perhaps more than usual. For example, they will be happy to share the full context on how events work at YC and what their goals are, but they won’t have answers to very specific questions because this is your project to build. 
What we are looking for

The goal is to create an user-facing event system that will help us manage events that YC runs, in conjunction with managing all the applicants to our events – both existing users and new signups to attend events.

Additionally, we want to see admin tools for YC employees to create and manage these events, including everything from creating, editing and approving/rejecting attendees for the event. 


