export const guildedMediaLink = (awsUrl: string) => {
    if (!awsUrl) return awsUrl;
    return awsUrl.replace('https://s3-us-west-2.amazonaws.com/www.guilded.gg', 'https://cdn.gilcdn.com');
  }