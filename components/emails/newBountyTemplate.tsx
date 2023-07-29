import React from 'react';

export const NewBountyTemplate = ({
  name,
  link,
}: {
  name: string;
  link: string;
}) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>
        Good news - a new bounty has arrived with your name on it. It&apos;s
        like finding a $20 bill in your pocket, but way more exciting. 💰
      </p>
      <p>Go Secure the Bag</p>
      <p>The Superteam Earn Crew 🦸‍♀️🦸‍♂️</p>
      <a href={link}>Link</a>
    </div>
  );
};
