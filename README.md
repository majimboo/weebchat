weebchat
========

[![Build Status](https://travis-ci.org/majimboo/weebchat.svg?branch=master)](https://travis-ci.org/majimboo/weebchat)

I was tasked to write a *telnet chat server* that is scalable and production
ready. The emphasis was on the network architecture and scalability.

A good fit for this task is a dynamically routed distributed server. The basic
idea is to have a loadbalancer listening on 2 ends, the front and the back.

The frontend - waits for incoming clients *a.k.a* the **users**. Each time a new
user gets connected, the front facing port of the loadbalancer acts as a
**lobby** to handle the requests of the users while NOT in a chatroom.

The backend - waits for incoming servers *a.k.a* the **workers**. The dynamic
number of workers is key to having a scalable architecture. Each time a new
worker is introduced it gets added to a list of workers kept by the
loadbalancer.

The workers are supposed to host a limited number of chatrooms, the number
of which is easily configurable by the administrator using a file.

When a new chatroom gets created, the loadbalancer looks into its list of
workers checking for one that isn't full yet. Then the loadbalancer tells the
worker to host the new chatroom. This repeats until the workers is full and
then the loadbalancer chooses another available workers from the list.

Suppose that the **loadbalancer** is a person, lets call him Guy. Guy is an egg
sorter, he does this for a living and he is very good at it.

The eggs he sorts are not your typical eggs. They come as normal eggs,
plain white, then in-time they magically turn into a different color.
This is when Guy needs to sort them.

While Guy waits for their transformation, the white eggs stay in the
white basket.

...to be continued
