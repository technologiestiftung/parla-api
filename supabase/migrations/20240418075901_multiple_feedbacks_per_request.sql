CREATE TABLE user_request_feedbacks (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    feedback_id INT NOT NULL REFERENCES feedbacks(id),
    user_request_id INT NOT NULL REFERENCES user_requests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    session_id TEXT NOT NULL
);

INSERT INTO user_request_feedbacks (feedback_id, user_request_id, session_id)
SELECT f.id as feedback_id, ur.id as user_request_id, '' as session_id
FROM user_requests ur
JOIN feedbacks f ON f.id = ur.feedback_id
WHERE ur.feedback_id IS NOT NULL;

ALTER TABLE user_requests DROP COLUMN feedback_id;